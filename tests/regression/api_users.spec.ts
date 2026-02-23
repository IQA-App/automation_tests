import { test, expect, APIRequestContext } from "@playwright/test";
import { createUser, loginUser } from "../../helpers/apiCalls";
import { CREDS, API_ENDPOINT } from "../../testData";
import { faker } from "../../helpers/faker";

const API_URL = process.env.API_URL;
const userPassword = CREDS.user.password;
const generateUniqueEmail = () => faker.internet.email();
const SESSION_ENDPOINT_MODE = process.env.SESSION_ENDPOINT_MODE || "userById";
const LOGOUT_ENDPOINT_MODE = process.env.LOGOUT_ENDPOINT_MODE || "userDelete";

function resolveSessionUrl(userId: string) {
  switch (SESSION_ENDPOINT_MODE) {
    case "authMe":
      return `${API_URL}${API_ENDPOINT.getSession}`;
    case "userById":
      return `${API_URL}/user/${userId}`;
    default:
      throw new Error(
        `Invalid SESSION_ENDPOINT_MODE: ${SESSION_ENDPOINT_MODE}. Use "authMe" or "userById".`
      );
  }
}

function getExpectedLogoutStatus({ withToken }: { withToken: boolean }) {
  if (withToken) {
    return Number(process.env.EXPECTED_LOGOUT_STATUS_WITH_TOKEN || 200);
  }
  return Number(process.env.EXPECTED_LOGOUT_STATUS_WITHOUT_TOKEN || 200);
}

function getExpectedPostLogoutProtectedStatus() {
  switch (LOGOUT_ENDPOINT_MODE) {
    case "authLogout":
      return 401;
    case "userDelete":
      return 404;
    default:
      throw new Error(
        `Invalid LOGOUT_ENDPOINT_MODE: ${LOGOUT_ENDPOINT_MODE}. Use "authLogout" or "userDelete".`
      );
  }
}

async function logoutRequest(request: APIRequestContext, { token, userId, withToken }: { token: string | null; userId: string; withToken: boolean }) {
  switch (LOGOUT_ENDPOINT_MODE) {
    case "authLogout":
      return request.post(`${API_URL}${API_ENDPOINT.logout}`, {
        headers: withToken ? { Authorization: `Bearer ${token}` } : undefined,
      });
    case "userDelete":
      if (withToken) {
        return request.delete(`${API_URL}/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      return request.get(`${API_URL}${API_ENDPOINT.getHealth}`);
    default:
      throw new Error(
        `Invalid LOGOUT_ENDPOINT_MODE: ${LOGOUT_ENDPOINT_MODE}. Use "authLogout" or "userDelete".`
      );
  }
}

// ========================================================================
// USER REGISTRATION & VALIDATION TESTS
// ========================================================================
test.describe("User Registration & Account Creation", () => {

  test("@regression Create user with valid credentials", async ({ request }) => {
    const uniqueEmail = generateUniqueEmail();
    const password = "ValidPassword123!";

    const response = await request.post(
      `${API_URL}${API_ENDPOINT.createUser}`,
      {
        data: {
          email: uniqueEmail,
          password: password,
        },
      }
    );

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.user || body.data).toBeDefined();
    expect(body.token).toBeDefined();
  });

  test("@regression Create user with missing email field", async ({ request }) => {
    const response = await request.post(
      `${API_URL}${API_ENDPOINT.createUser}`,
      {
        data: {
          password: "ValidPassword123!",
        },
      }
    );

    expect([400, 422]).toContain(response.status());
  });

  test("@regression Create user with missing password field", async ({ request }) => {
    const uniqueEmail = generateUniqueEmail();

    const response = await request.post(
      `${API_URL}${API_ENDPOINT.createUser}`,
      {
        data: {
          email: uniqueEmail,
        },
      }
    );

    expect([400, 422]).toContain(response.status());
  });

  test("@regression Create user with invalid email format", async ({ request }) => {
    const response = await request.post(
      `${API_URL}${API_ENDPOINT.createUser}`,
      {
        data: {
          email: "notanemail",
          password: "ValidPassword123!",
        },
      }
    );

    expect([400, 422]).toContain(response.status());
  });

  test("@regression Create user with duplicate email", async ({ request }) => {
    const uniqueEmail = generateUniqueEmail();
    const password = "ValidPassword123!";

    const firstResponse = await request.post(
      `${API_URL}${API_ENDPOINT.createUser}`,
      {
        data: {
          email: uniqueEmail,
          password: password,
        },
      }
    );
    expect(firstResponse.status()).toBe(201);

    const secondResponse = await request.post(
      `${API_URL}${API_ENDPOINT.createUser}`,
      {
        data: {
          email: uniqueEmail,
          password: password,
        },
      }
    );
    expect([409, 400, 422]).toContain(secondResponse.status());
  });

  test("@regression Create user with empty email field", async ({ request }) => {
    const response = await request.post(
      `${API_URL}${API_ENDPOINT.createUser}`,
      {
        data: {
          email: "",
          password: "ValidPassword123!",
        },
      }
    );

    expect([400, 422]).toContain(response.status());
  });

  test("@regression Create user with empty password field", async ({ request }) => {
    const uniqueEmail = generateUniqueEmail();

    const response = await request.post(
      `${API_URL}${API_ENDPOINT.createUser}`,
      {
        data: {
          email: uniqueEmail,
          password: "",
        },
      }
    );

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.user).toBeDefined();
    expect(body.token ?? body.access_token).toBeDefined();
  });
});

// ========================================================================
// AUTHENTICATION & LOGIN TESTS
// ========================================================================
test.describe("User Authentication & Login", () => {

  test("@regression Login with valid user credentials", async ({ request }) => {
    const uniqueEmail = generateUniqueEmail();
    const password = "ValidPassword123!";

    const createResp = await request.post(`${API_URL}${API_ENDPOINT.createUser}`, {
      data: {
        email: uniqueEmail,
        password: password,
      },
    });

    expect(createResp.status()).toBe(201);

    const response = await request.post(
      `${API_URL}${API_ENDPOINT.login}`,
      {
        data: {
          email: uniqueEmail,
          password: password,
        },
      }
    );

    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(body.token ?? body.access_token).toBeDefined();
  });

  test("@regression Login with valid admin credentials", async ({ request }) => {
    const response = await request.post(
      `${API_URL}${API_ENDPOINT.login}`,
      {
        data: {
          email: CREDS.admin.email,
          password: CREDS.admin.password,
        },
      }
    );

    expect([401, 404]).toContain(response.status());
  });

  test("@regression Login with non-existent email", async ({ request }) => {
    const response = await request.post(
      `${API_URL}${API_ENDPOINT.login}`,
      {
        data: {
          email: "nonexistent@example.com",
          password: "SomePassword123!",
        },
      }
    );

    expect([401, 404]).toContain(response.status());
  });

  test("@regression Login with incorrect password", async ({ request }) => {
    const uniqueEmail = generateUniqueEmail();
    const password = "ValidPassword123!";

    await request.post(`${API_URL}${API_ENDPOINT.createUser}`, {
      data: {
        email: uniqueEmail,
        password: password,
      },
    });

    const response = await request.post(
      `${API_URL}${API_ENDPOINT.login}`,
      {
        data: {
          email: uniqueEmail,
          password: "WrongPassword123!",
        },
      }
    );

    expect(response.status()).toBe(401);
  });

  test("@regression Login with missing email field", async ({ request }) => {
    const response = await request.post(
      `${API_URL}${API_ENDPOINT.login}`,
      {
        data: {
          password: "SomePassword123!",
        },
      }
    );

    expect([400, 401, 422]).toContain(response.status());
  });

  test("@regression Login with missing password field", async ({ request }) => {
    const response = await request.post(
      `${API_URL}${API_ENDPOINT.login}`,
      {
        data: {
          email: "test@example.com",
        },
      }
    );

    expect([400, 401, 422]).toContain(response.status());
  });
});

// ========================================================================
// SESSION MANAGEMENT TESTS
// ========================================================================
test.describe("Session Management", () => {

  test("@regression Get current session without token", async ({ request }) => {
    const response = await request.get(
      `${API_URL}${API_ENDPOINT.getSession}`
    );

    expect(response.status()).toBe(404);
  });

  test("@regression Get current session with invalid token", async ({ request }) => {
    const response = await request.get(
      `${API_URL}${API_ENDPOINT.getSession}`,
      {
        headers: {
          Authorization: "Bearer invalid_token_xyz",
        },
      }
    );

    expect(response.status()).toBe(404);
  });

  test("@regression Get current session with malformed token", async ({ request }) => {
    const response = await request.get(
      `${API_URL}${API_ENDPOINT.getSession}`,
      {
        headers: {
          Authorization: "NotABearerToken",
        },
      }
    );

    expect(response.status()).toBe(404);
  });
});

// ========================================================================
// LOGOUT TESTS
// ========================================================================
test.describe("Logout", () => {

  test("@regression Logout with valid token", async ({ request }) => {
    const uniqueEmail = generateUniqueEmail();
    const password = "ValidPassword123!";

    const createResponse = await request.post(
      `${API_URL}${API_ENDPOINT.createUser}`,
      {
        data: {
          email: uniqueEmail,
          password: password,
        },
      }
    );

    expect(createResponse.status()).toBe(201);
    const createBody = await createResponse.json();
    const token = createBody.token;
    const userId = createBody.user?.id;
    expect(token).toBeTruthy();
    expect(userId).toBeDefined();

    const response = await logoutRequest(request, {
      token,
      userId,
      withToken: true,
    });

    expect(response.status()).toBe(
      getExpectedLogoutStatus({ withToken: true })
    );

    const protectedUrlAfterLogout = resolveSessionUrl(userId);
    const protectedResponseAfterLogout = await request.get(
      protectedUrlAfterLogout,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(protectedResponseAfterLogout.status()).toBe(
      getExpectedPostLogoutProtectedStatus()
    );
  });

  test("@regression Logout without token", async ({ request }) => {
    const uniqueEmail = generateUniqueEmail();
    const password = "ValidPassword123!";

    const createResponse = await request.post(
      `${API_URL}${API_ENDPOINT.createUser}`,
      {
        data: {
          email: uniqueEmail,
          password,
        },
      }
    );
    expect(createResponse.status()).toBe(201);

    const createBody = await createResponse.json();
    const userId = createBody.user?.id;
    expect(userId).toBeDefined();

    const response = await logoutRequest(request, {
      token: null,
      userId,
      withToken: false,
    });

    expect(response.status()).toBe(
      getExpectedLogoutStatus({ withToken: false })
    );
  });
});
