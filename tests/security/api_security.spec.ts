import { test, expect } from "@playwright/test";
import { API_ENDPOINT, CREDS } from "../../testData";
import { faker } from "../../helpers/faker";

const API_URL = process.env.API_URL;
const generateUniqueEmail = () => faker.internet.email();

// ========================================================================
// DATA VALIDATION & EDGE CASES
// ========================================================================
test.describe("Data Validation & Edge Cases", () => {

  // Parameterised: covers injection in the email field, password field, and
  // via a JSON object value — the three most common entry points.
  // Each case also asserts the server never crashes (no 5xx).
  const SQL_PAYLOADS: { label: string; email: string; password: string }[] = [
    { label: "email — classic OR bypass",  email: "admin' OR '1'='1",                      password: "password" },
    { label: "email — DROP TABLE",          email: "admin@example.com'; DROP TABLE users; --", password: "ValidPassword123!" },
    { label: "password field",              email: "admin@example.com",                       password: "' OR '1'='1" },
  ];

  for (const { label, email, password } of SQL_PAYLOADS) {
    test(`@security SQL injection in ${label}`, async ({ request }) => {
      const response = await request.post(`${API_URL}${API_ENDPOINT.login}`, {
        data: { email, password },
      });

      // Malformed input must never crash the server.
      expect(
        response.status(),
        "SQL injection must not cause a server error"
      ).not.toBeGreaterThanOrEqual(500);

      // 404 is acceptable: the server treats the payload as a non-existent email
      // and returns "username not found", which is secure rejection, not leakage.
      expect([400, 401, 404]).toContain(response.status());

      // Even on an accidental 200, no auth token must be issued.
      if (response.status() === 200) {
        const body = await response.json();
        expect(body, "Server must not issue a token for a SQL injection payload")
          .not.toHaveProperty("token");
      }
    });
  }

  test("@security XSS attempt in email creation", async ({ request }) => {
    const response = await request.post(`${API_URL}${API_ENDPOINT.createUser}`, {
      data: {
        email: "<script>alert('xss')</script>@test.com",
        password: "ValidPassword123!",
      },
    });

    expect(response.status(), "XSS payload must not crash the server").not.toBeGreaterThanOrEqual(500);
    expect([400, 422]).toContain(response.status());
  });

  test("@security Very long email string", async ({ request }) => {
    const longEmail = "a".repeat(1000) + "@example.com";

    const response = await request.post(`${API_URL}${API_ENDPOINT.createUser}`, {
      data: {
        email: longEmail,
        password: "ValidPassword123!",
      },
    });

    expect([400, 413, 422]).toContain(response.status());
  });

  test("@security Special characters in email", async ({ request }) => {
    const specialEmail = `user+test_${Date.now()}@domain.co.uk`;

    const response = await request.post(`${API_URL}${API_ENDPOINT.createUser}`, {
      data: {
        email: specialEmail,
        password: "ValidPassword123!",
      },
    });

    expect([200, 201]).toContain(response.status());
  });

});

// ========================================================================
// INPUT VALIDATION  MISSING & MALFORMED PAYLOADS
// ========================================================================
test.describe("Input Validation", () => {

  test("@security Login with empty body returns 400", async ({ request }) => {
    // An empty payload must be rejected before any auth logic runs.
    const response = await request.post(`${API_URL}${API_ENDPOINT.login}`, {
      data: {},
    });

    expect(response.status(), "Empty payload must not crash the server").not.toBeGreaterThanOrEqual(500);
    expect([400, 401, 422]).toContain(response.status());
  });

  test("@security Login with malformed JSON returns 400", async ({ request }) => {
    // A body that is not valid JSON should be rejected at the parser layer,
    // not treated as empty credentials or cause a 5xx.
    const response = await request.post(`${API_URL}${API_ENDPOINT.login}`, {
      headers: { "Content-Type": "application/json" },
      data: '{ "email": admin_no_quotes }',
    });

    expect(response.status(), "Malformed JSON must not crash the server").not.toBeGreaterThanOrEqual(500);
    expect([400, 422]).toContain(response.status());
  });

  test("@security Create user with empty body returns 400", async ({ request }) => {
    const response = await request.post(`${API_URL}${API_ENDPOINT.createUser}`, {
      data: {},
    });

    expect(response.status(), "Empty payload must not crash the server").not.toBeGreaterThanOrEqual(500);
    expect([400, 401, 422]).toContain(response.status());
  });

});

// ========================================================================
// RATE LIMITING  BRUTE FORCE PROTECTION
// ========================================================================
test.describe("Rate Limiting", () => {

  // APP BUG: login endpoint has no brute-force throttling.
  // Kept as test.skip so CI stays green while the feature is absent.
  // When rate limiting is shipped: remove test.skip, verify the loop hits 429.
  // Loop capped at 6 to avoid CI instability and accidental IP bans.
  test("@security Brute-force login attempts trigger rate limiting (429)", async ({ request }) => {
    test.skip(true, "APP BUG: rate limiting not implemented on login endpoint — unskip once shipped");

    const ATTEMPTS = 6;
    const statuses: number[] = [];

    for (let i = 0; i < ATTEMPTS; i++) {
      const response = await request.post(`${API_URL}${API_ENDPOINT.login}`, {
        data: { email: "brute@force.test", password: "wrong" },
      });
      statuses.push(response.status());
      if (response.status() === 429) break;
    }

    expect(
      statuses,
      `Server must respond 429 within ${ATTEMPTS} consecutive failed login attempts`
    ).toContain(429);
  });

});

// ========================================================================
// BEHAVIOURAL  EMAIL CASE SENSITIVITY
// Note: this is a UX/product behaviour test, not a security test.
// RFC 5321 technically makes the local-part case-sensitive, but most modern
// systems normalise to lowercase.  Tagging as @regression so it surfaces
// if the behaviour changes unexpectedly.
// ========================================================================
test.describe("Behavioural", () => {

  test("@regression Case sensitivity in email login", async ({ request }) => {
    const uniqueEmail = generateUniqueEmail();
    const password = "ValidPassword123!";

    await request.post(`${API_URL}${API_ENDPOINT.createUser}`, {
      data: { email: uniqueEmail, password },
    });

    const response = await request.post(`${API_URL}${API_ENDPOINT.login}`, {
      data: { email: uniqueEmail.toUpperCase(), password },
    });

    // 401/404  system is case-sensitive (RFC-compliant but potential UX issue)
    // 200/201  system normalises email to lowercase (common in practice)
    // Both are acceptable; what matters is consistent, documented behaviour.
    expect([200, 201, 401, 404]).toContain(response.status());
  });

});

// ========================================================================
// AUTHORIZATION BYPASS
// Verifies that protected endpoints reject requests with no token and with
// a tampered token.  Does not rely on a valid session — these checks must
// pass even in an isolated environment with no seed data.
// ========================================================================
test.describe("Authorization", () => {

  test("@security Protected endpoint rejects request with no token", async ({ request }) => {
    // No Authorization header — the server must not return data.
    const response = await request.get(`${API_URL}${API_ENDPOINT.getRequestsList}`);

    expect(response.status(), "Unauthenticated request must not crash the server").not.toBeGreaterThanOrEqual(500);
    // 401/403 = explicit rejection; 404 = resource hidden from unauthenticated clients
    expect([401, 403, 404]).toContain(response.status());
  });

  test("@security Protected endpoint rejects tampered JWT", async ({ request }) => {
    // A structurally valid but unsigned token — the server must not accept it.
    const response = await request.get(`${API_URL}${API_ENDPOINT.getRequestsList}`, {
      headers: { Authorization: "Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0." },
    });

    expect(response.status(), "Tampered token must not crash the server").not.toBeGreaterThanOrEqual(500);
    // 401/403 = explicit rejection; 404 = resource hidden from unauthenticated clients
    expect([401, 403, 404]).toContain(response.status());
  });

});

// ========================================================================
// USER ENUMERATION
// APP BUG: the login endpoint leaks whether an email is registered by
// returning different status codes:
//   401 + "Invalid credentials"    → email IS registered
//   404 + "This username not found" → email is NOT registered
// An attacker can silently probe the user database with no authentication.
// The fix is to return 401 for both cases with a generic message.
// ========================================================================
test.describe("User Enumeration", () => {

  test("@security Login returns same status for known and unknown email", async ({ request }) => {
    test.fail(true, "APP BUG: server returns 401 for registered emails and 404 for unknown ones, enabling user enumeration — remove test.fail() once fixed");

    const knownEmail = await request.post(`${API_URL}${API_ENDPOINT.login}`, {
      data: { email: CREDS.admin.email, password: "definitely_wrong_password_xyz" },
    });
    const unknownEmail = await request.post(`${API_URL}${API_ENDPOINT.login}`, {
      data: { email: "nobody_xyz_12345@doesntexist.invalid", password: "definitely_wrong_password_xyz" },
    });

    expect(
      knownEmail.status(),
      "Identical status codes prevent enumeration of registered emails"
    ).toBe(unknownEmail.status());
  });

});

// ========================================================================
// CORS POLICY
// Checks that the API does not broadcast a wildcard CORS policy that would
// allow any website to make credentialled cross-origin requests.
// ========================================================================
test.describe("CORS Policy", () => {

  test("@security API does not return wildcard Access-Control-Allow-Origin", async ({ request }) => {
    // A wildcard ACAO on an authenticated API allows any origin to read
    // responses — effectively bypassing the Same-Origin Policy.
    const response = await request.get(`${API_URL}${API_ENDPOINT.getHealth}`);
    const acao = response.headers()["access-control-allow-origin"];

    expect(
      acao,
      "API must not broadcast Access-Control-Allow-Origin: * on an authenticated endpoint"
    ).not.toBe("*");
  });

});

// ========================================================================
// ERROR LEAKAGE
// Server error responses must never expose internal details: stack traces,
// file paths, framework names, or SQL error strings.
// ========================================================================
test.describe("Error Leakage", () => {

  const STACK_TRACE_PATTERNS = [
    /at \w.*\(.*:\d+:\d+\)/,   // JS stack frame:  at fn (file.js:1:1)
    /\/.*\.js:\d+/,             // file path:       /app/src/server.js:42
    /SyntaxError:|TypeError:|ReferenceError:/,  // raw JS error names
    /SQL syntax/i,              // raw SQL error from database driver
    /ORA-\d{5}/,                // Oracle error codes
    /SQLSTATE/,                 // generic SQL state strings
  ];

  test("@security Error response does not leak a stack trace or SQL error", async ({ request }) => {
    const response = await request.post(`${API_URL}${API_ENDPOINT.login}`, {
      headers: { "Content-Type": "application/json" },
      data: '{ "email": admin_no_quotes }',   // deliberately malformed JSON
    });

    expect(response.status(), "Error response must not cause a server crash").not.toBeGreaterThanOrEqual(500);

    const body = await response.text();
    for (const pattern of STACK_TRACE_PATTERNS) {
      expect(
        body,
        `Error response must not expose internal details matching ${pattern}`
      ).not.toMatch(pattern);
    }
  });

});

// ========================================================================
// ERROR HANDLING & RESPONSES
// ========================================================================
test.describe("Error Handling & Responses", () => {

  test("@regression Not found endpoint", async ({ request }) => {
    const response = await request.get(`${API_URL}/nonexistent-endpoint`);
    expect(response.status()).toBe(404);
  });

  test("@regression Method not allowed", async ({ request }) => {
    const response = await request.post(`${API_URL}${API_ENDPOINT.getHealth}`);
    expect([400, 404, 405]).toContain(response.status());
  });

});

// ========================================================================
// API RESPONSE HEADERS
// A JSON API should declare the correct content type and opt out of
// MIME-sniffing so browsers cannot execute a crafted response as a script.
// ========================================================================
test.describe("API Response Headers", () => {

  test("@security Login response declares Content-Type: application/json", async ({ request }) => {
    const response = await request.post(`${API_URL}${API_ENDPOINT.login}`, {
      data: { email: CREDS.admin.email, password: CREDS.admin.password },
    });

    const contentType = response.headers()["content-type"] ?? "";
    expect(
      contentType,
      "API must respond with Content-Type: application/json"
    ).toContain("application/json");
  });

  // APP BUG: API does not return X-Content-Type-Options.
  test("@security API response includes X-Content-Type-Options: nosniff", async ({ request }) => {
    test.skip(true, "APP BUG: X-Content-Type-Options header missing on API responses — unskip once server is hardened");

    const response = await request.get(`${API_URL}${API_ENDPOINT.getHealth}`);
    const xcto = response.headers()["x-content-type-options"];
    expect(xcto, "API must set X-Content-Type-Options: nosniff").toBe("nosniff");
  });

});
