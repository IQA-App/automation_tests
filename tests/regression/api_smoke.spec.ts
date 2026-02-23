import { test, expect } from "@playwright/test";
import {
  getHealth,
  createUser,
  loginUser,
  getUser,
} from "../../helpers/apiCalls";
import { CREDS, API_ENDPOINT } from "../../testData";
import { faker } from "../../helpers/faker";

const API_URL = process.env.API_URL;
const userPassword = CREDS.user.password;
const generateUniqueEmail = () => faker.internet.email();
const SESSION_ENDPOINT_MODE = process.env.SESSION_ENDPOINT_MODE || "userById";

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

// ============================================================================
// API SMOKE TESTS
// ============================================================================
test.describe("API Smoke Tests", () => {
  test("@smoke @regression health check API", async ({ request }) => {
    const response = await getHealth(request);
    const body = await response.json();
    console.log("Response Body:", body);
    console.log("Status Code:", response.status());
    expect(response.status()).toBe(200);
  });

  test("@smoke @regression Create user through API", async ({ request }) => {
    const email = generateUniqueEmail();
    const response = await createUser(request, email, userPassword);
    const body = await response.json();
    console.log(body);
    expect(response.status()).toBe(201);
    expect(body.user).toBeDefined();
    expect(body.user.id).toBeDefined();
    expect(body.user.email).toEqual(email);
    expect(body.token).toBeDefined();
  });

  test("@smoke @regression Login user through API", async ({ request }) => {
    const email = generateUniqueEmail();
    await createUser(request, email, userPassword);
    const response = await loginUser(request, email, userPassword);
    const body = await response.json();
    console.log(body);
    expect([200, 201]).toContain(response.status());
    expect(body.access_token).toBeDefined();
    expect(body.id).toBeDefined();
    expect(body.email).toEqual(email);
    expect(body.role).toBeDefined();
  });

  test("@smoke @regression Get current session with valid token", async ({ request }) => {
    const uniqueEmail = generateUniqueEmail();
    const password = "ValidPassword123!";

    const createResponse = await request.post(
      `${API_URL}${API_ENDPOINT.createUser}`,
      {
        data: { email: uniqueEmail, password },
      }
    );

    expect(createResponse.status()).toBe(201);

    const { user, token } = await createResponse.json();
    expect(user?.id).toBeDefined();
    expect(token).toBeTruthy();

    const sessionUrl = resolveSessionUrl(user.id);
    const sessionResponse = await request.get(sessionUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(sessionResponse.status()).toBe(200);

    const sessionBody = await sessionResponse.json();

    expect(sessionBody).toMatchObject({
      id: user.id,
      email: uniqueEmail,
    });
  });

  test("@smoke @regression Create request with valid data", async ({ request }) => {
    // Create and login user
    const uniqueEmail = generateUniqueEmail();
    const password = "ValidPassword123!";

    const createUserResponse = await request.post(
      `${API_URL}${API_ENDPOINT.createUser}`,
      {
        data: {
          email: uniqueEmail,
          password: password,
        },
      }
    );

    const userBody = await createUserResponse.json();
    const token = userBody.token;

    // Create request
    const response = await request.post(
      `${API_URL}/orders`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          customerName: "Test Request",
          description: "This is a test request",
        },
      }
    );

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.order?.orderId).toBeDefined();
    expect(body.order?.customerName).toBe("Test Request");
  });

  test("@smoke @regression Get request by valid ID", async ({ request }) => {
    // Create and login user
    const uniqueEmail = generateUniqueEmail();
    const password = "ValidPassword123!";

    const createUserResponse = await request.post(
      `${API_URL}${API_ENDPOINT.createUser}`,
      {
        data: {
          email: uniqueEmail,
          password: password,
        },
      }
    );

    const userBody = await createUserResponse.json();
    const token = userBody.token;

    // Create request
    const createRequestResponse = await request.post(
      `${API_URL}/orders`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          customerName: "Test Request",
          description: "This is a test request",
        },
      }
    );
    expect(createRequestResponse.status()).toBe(201);

    const requestBody = await createRequestResponse.json();
    const requestId = requestBody.order?.orderId;
    expect(requestId).toBeDefined();

    // Get request
    const response = await request.get(
      `${API_URL}/orders/${requestId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.order?.orderId).toEqual(requestId);
    expect(body.order?.customerName).toBe("Test Request");
  });
});
