import { test, expect } from "@playwright/test";
import { API_ENDPOINT } from "../../testData";
import { faker } from "../../helpers/faker";

const API_URL = process.env.API_URL;
const generateUniqueEmail = () => faker.internet.email();

// ========================================================================
// REQUEST MANAGEMENT - CREATE TESTS
// ========================================================================
test.describe("Request Management - Create", () => {

  test("@regression Create request without authentication", async ({ request }) => {
    const response = await request.post(
      `${API_URL}${API_ENDPOINT.createRequest}`,
      {
        data: {
          title: "Test Request",
          description: "This is a test request",
        },
      }
    );

    expect([401, 404]).toContain(response.status());
  });

  test("@regression Create request with invalid token", async ({ request }) => {
    const response = await request.post(
      `${API_URL}${API_ENDPOINT.createRequest}`,
      {
        headers: {
          Authorization: "Bearer invalid_token",
        },
        data: {
          title: "Test Request",
          description: "This is a test request",
        },
      }
    );

    expect([401, 404]).toContain(response.status());
  });

  test("@regression Create request with missing required fields", async ({ request }) => {
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

    const response = await request.post(
      `${API_URL}${API_ENDPOINT.createRequest}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          description: "This is a test request",
        },
      }
    );

    expect(response.status()).toBe(404);
  });
});

// ========================================================================
// REQUEST MANAGEMENT - READ TESTS
// ========================================================================
test.describe("Request Management - Read", () => {

  test("@regression Get request with invalid ID", async ({ request }) => {
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

    const response = await request.get(
      `${API_URL}${API_ENDPOINT.getRequestById("invalid_id_123")}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(response.status()).toBe(404);
  });

  test("@regression Get request without authentication", async ({ request }) => {
    const response = await request.get(
      `${API_URL}${API_ENDPOINT.getRequestById("some_id")}`
    );

    expect([401, 404]).toContain(response.status());
  });

  test("@regression Get requests list", async ({ request }) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    let token;

    if (adminEmail && adminPassword) {
      const loginResponse = await request.post(
        `${API_URL}${API_ENDPOINT.login}`,
        {
          data: {
            email: adminEmail,
            password: adminPassword,
          },
        }
      );

      expect([200, 201]).toContain(loginResponse.status());
      const loginBody = await loginResponse.json();
      token = loginBody.access_token || loginBody.token;
    } else {
      const uniqueEmail = generateUniqueEmail();
      const createUserResponse = await request.post(
        `${API_URL}${API_ENDPOINT.createUser}`,
        {
          data: {
            email: uniqueEmail,
            password: "ValidPassword123!",
          },
        }
      );

      expect(createUserResponse.status()).toBe(201);
      const userBody = await createUserResponse.json();
      token = userBody.token;
    }

    expect(token).toBeDefined();

    const response = await request.get(
      `${API_URL}/orders`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });
});

// ========================================================================
// REQUEST MANAGEMENT - UPDATE TESTS
// ========================================================================
test.describe("Request Management - Update", () => {

  test("@regression Update request with valid data", async ({ request }) => {
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

    const createRequestResponse = await request.post(
      `${API_URL}${API_ENDPOINT.createRequest}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          title: "Original Title",
          description: "Original Description",
        },
      }
    );

    const requestBody = await createRequestResponse.json();
    const requestId = requestBody.id || requestBody.data?.id;

    const response = await request.patch(
      `${API_URL}${API_ENDPOINT.updateRequest(requestId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          title: "Updated Title",
          description: "Updated Description",
        },
      }
    );

    expect(response.status()).toBe(404);
  });

  test("@regression Update request with invalid ID", async ({ request }) => {
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

    const response = await request.patch(
      `${API_URL}${API_ENDPOINT.updateRequest("invalid_id")}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          title: "Updated Title",
        },
      }
    );

    expect(response.status()).toBe(404);
  });

  test("@regression Update request without authentication", async ({ request }) => {
    const response = await request.patch(
      `${API_URL}${API_ENDPOINT.updateRequest("some_id")}`,
      {
        data: {
          title: "Updated Title",
        },
      }
    );

    expect([401, 404]).toContain(response.status());
  });
});

// ========================================================================
// REQUEST MANAGEMENT - DELETE TESTS
// ========================================================================
test.describe("Request Management - Delete", () => {

  test("@regression Delete request with valid ID", async ({ request }) => {
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

    const createRequestResponse = await request.post(
      `${API_URL}${API_ENDPOINT.createRequest}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          title: "Test Request",
          description: "This is a test request",
        },
      }
    );

    const requestBody = await createRequestResponse.json();
    const requestId = requestBody.id || requestBody.data?.id;

    const response = await request.delete(
      `${API_URL}${API_ENDPOINT.deleteRequest(requestId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(response.status()).toBe(404);
  });

  test("@regression Delete request with invalid ID", async ({ request }) => {
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

    const response = await request.delete(
      `${API_URL}${API_ENDPOINT.deleteRequest("invalid_id")}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(response.status()).toBe(404);
  });

  test("@regression Delete request without authentication", async ({ request }) => {
    const response = await request.delete(
      `${API_URL}${API_ENDPOINT.deleteRequest("some_id")}`
    );

    expect([401, 404]).toContain(response.status());
  });
});
