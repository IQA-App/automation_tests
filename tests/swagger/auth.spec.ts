import { test, expect } from "@playwright/test";
import { faker } from "../../helpers/faker";
import { CREDS } from "../../testData";

const BASE_URL = process.env.API_URL || "https://dev0pz.com/api";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;
const newEmail = () => faker.internet.email();

async function createUser(request: any, email: string, password: string) {
    console.log(`Creating user with email: ${email}`);
  return request.post(`${BASE_URL}/user`, { data: { email, password } });
}

async function getAdminToken(request: any): Promise<string | null> {
  const res = await request.post(`${BASE_URL}/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (res.status() !== 201) return null;
  const { access_token } = await res.json();
  return access_token || null;
}

// ─── POST /auth/login ─────────────────────────────────────────────────────────

test.describe("POST /auth/login — login", () => {

  test("@swagger 201 valid credentials return JWT token", async ({ request }) => {
    // Use a fresh user (admin account may not be seeded in this environment)
    const email = newEmail();
    await createUser(request, email, CREDS.user.password);

    const res = await request.post(`${BASE_URL}/auth/login`, {
      data: { email, password: CREDS.user.password },
    });
    const body = await res.json();

    expect(res.status()).toBe(201);
    expect(body.access_token).toBeDefined();
    expect(body.id).toBeDefined();
    expect(body.email).toBe(email);
    expect(body.role).toBeDefined();
  });

  test("@swagger 401 wrong password returns 401", async ({ request }) => {
    const email = newEmail();
    await createUser(request, email, CREDS.user.password);

    const res = await request.post(`${BASE_URL}/auth/login`, {
      data: { email, password: "WrongPassword999!" },
    });
    expect(res.status()).toBe(401);
  });

  test("@swagger 404 non-existent email returns 404", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/auth/login`, {
      data: { email: "nobody_xyz@fake-domain.example", password: CREDS.user.password },
    });
    expect(res.status()).toBe(404);
  });

  test("@swagger 401 missing email returns 401", async ({ request }) => {
    // API returns 401 (treats missing fields as invalid credentials, not bad request)
    const res = await request.post(`${BASE_URL}/auth/login`, {
      data: { password: CREDS.user.password },
    });
    expect(res.status()).toBe(401);
  });

  test("@swagger 401 missing password returns 401", async ({ request }) => {
    // API returns 401 (treats missing fields as invalid credentials, not bad request)
    const res = await request.post(`${BASE_URL}/auth/login`, {
      data: { email: ADMIN_EMAIL },
    });
    expect(res.status()).toBe(401);
  });

  test("@swagger 401 empty body returns 401", async ({ request }) => {
    // API returns 401 (treats empty body as invalid credentials, not bad request)
    const res = await request.post(`${BASE_URL}/auth/login`, { data: {} });
    expect(res.status()).toBe(401);
  });

});

// ─── GET /auth/profile ────────────────────────────────────────────────────────

test.describe("GET /auth/profile — get profile", () => {

  test("@swagger 401 endpoint requires authentication", async ({ request }) => {
    // API docs say 'not ready yet' but endpoint requires auth (returns 401 without token)
    const res = await request.get(`${BASE_URL}/auth/profile`);
    expect(res.status()).toBe(401);
  });

});

// ─── POST /auth/forgot-password ───────────────────────────────────────────────

test.describe("POST /auth/forgot-password — send reset code", () => {

  test("@swagger 201 sends reset code for existing user email", async ({ request }) => {
    const email = newEmail();
    await createUser(request, email, CREDS.user.password);

    const res = await request.post(`${BASE_URL}/auth/forgot-password`, {
      data: { email },
    });
    console.log("Forgot password response status:", res.status());
    console.log("Forgot password response body:", await res.json());
    // 201 = code sent; 400 = a code is already pending (business rule)
    expect([201, 400]).toContain(res.status());
  });

  test("@swagger 404 non-existent email returns 404", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/auth/forgot-password`, {
      data: { email: "nobody_xyz@fake-domain.example" },
    });
    expect(res.status()).toBe(404);
  });

  test("@swagger 400 missing email field returns 400", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/auth/forgot-password`, { data: {} });
    expect(res.status()).toBe(400);
  });

});

// ─── PATCH /auth/reset-password ───────────────────────────────────────────────

test.describe("PATCH /auth/reset-password — reset password", () => {

  test("@swagger 400 empty body returns 400", async ({ request }) => {
    const res = await request.patch(`${BASE_URL}/auth/reset-password`, { data: {} });
    expect(res.status()).toBe(400);
  });

  test("@swagger 400 or 404 invalid confirmation code is rejected", async ({ request }) => {
    const res = await request.patch(`${BASE_URL}/auth/reset-password`, {
      data: {
        email:            ADMIN_EMAIL,
        confirmationCode: "000000",
        newPassword:      "NewPass123!",
        confirmPassword:  "NewPass123!",
      },
    });
    expect([400, 404]).toContain(res.status());
  });

  test("@swagger 400 mismatched passwords are rejected", async ({ request }) => {
    const res = await request.patch(`${BASE_URL}/auth/reset-password`, {
      data: {
        email:            ADMIN_EMAIL,
        confirmationCode: "123456",
        newPassword:      "NewPass123!",
        confirmPassword:  "DifferentPass456!",
      },
    });
    expect([400, 404]).toContain(res.status());
  });

});

// ─── GET /auth/all-codes ──────────────────────────────────────────────────────

test.describe("GET /auth/all-codes — get all confirmation codes (admin)", () => {

  test("@swagger 200 admin can retrieve all confirmation codes", async ({ request }) => {
    const token = await getAdminToken(request);
    expect(token, "Admin login failed — verify ADMIN_EMAIL / ADMIN_PASSWORD in .env").toBeTruthy();

    const res = await request.get(`${BASE_URL}/auth/all-codes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // API docs note: "this endpoint is not ready yet"
    expect(res.status()).toBe(200);
  });

  test("@swagger 401 unauthenticated request is rejected", async ({ request }) => {
    // API returns 401 (not 403) for requests with no token
    const res = await request.get(`${BASE_URL}/auth/all-codes`);
    expect(res.status()).toBe(401);
  });

});
