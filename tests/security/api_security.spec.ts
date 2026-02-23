import { test, expect } from "@playwright/test";
import { API_ENDPOINT } from "../../testData";
import { faker } from "../../helpers/faker";

const API_URL = process.env.API_URL;
const generateUniqueEmail = () => faker.internet.email();

// ========================================================================
// DATA VALIDATION & EDGE CASES
// ========================================================================
test.describe("Data Validation & Edge Cases", () => {

  test("@security SQL injection attempt in login email", async ({ request }) => {
    const response = await request.post(
      `${API_URL}${API_ENDPOINT.login}`,
      {
        data: {
          email: "admin' OR '1'='1",
          password: "password",
        },
      }
    );

    expect([400, 401, 404]).toContain(response.status());
  });

  test("@security XSS attempt in email creation", async ({ request }) => {
    const response = await request.post(
      `${API_URL}${API_ENDPOINT.createUser}`,
      {
        data: {
          email: "<script>alert('xss')</script>@test.com",
          password: "ValidPassword123!",
        },
      }
    );

    expect([400, 422]).toContain(response.status());
  });

  test("@security Very long email string", async ({ request }) => {
    const longEmail = "a".repeat(1000) + "@example.com";

    const response = await request.post(
      `${API_URL}${API_ENDPOINT.createUser}`,
      {
        data: {
          email: longEmail,
          password: "ValidPassword123!",
        },
      }
    );

    expect([400, 413, 422]).toContain(response.status());
  });

  test("@security Special characters in email", async ({ request }) => {
    const specialEmail = `user+test_${Date.now()}@domain.co.uk`;

    const response = await request.post(
      `${API_URL}${API_ENDPOINT.createUser}`,
      {
        data: {
          email: specialEmail,
          password: "ValidPassword123!",
        },
      }
    );

    expect([200, 201]).toContain(response.status());
  });

  test("@security Case sensitivity in email login", async ({ request }) => {
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
          email: uniqueEmail.toUpperCase(),
          password: password,
        },
      }
    );

    expect([401, 404]).toContain(response.status());
  });
});

// ========================================================================
// ERROR HANDLING & RESPONSES
// ========================================================================
test.describe("Error Handling & Responses", () => {

  test("@regression Not found endpoint", async ({ request }) => {
    const response = await request.get(
      `${API_URL}/nonexistent-endpoint`
    );

    expect(response.status()).toBe(404);
  });

  test("@regression Method not allowed", async ({ request }) => {
    const response = await request.post(
      `${API_URL}${API_ENDPOINT.getHealth}`
    );

    expect([405, 404, 400]).toContain(response.status());
  });
});
