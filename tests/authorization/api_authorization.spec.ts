import { test, expect } from "@playwright/test";
import { API_ENDPOINT } from "../../testData";
import { faker } from "../../helpers/faker";

const API_URL = process.env.API_URL;
const generateUniqueEmail = () => faker.internet.email();

// ========================================================================
// AUTHORIZATION & PERMISSIONS
// ========================================================================
test.describe("Authorization & Permissions", () => {

  test("@regression @authorization User cannot access other user's request", async ({ request }) => {
    const password = "ValidPassword123!";

    // Create user 1 and request
    const user1Response = await request.post(
      `${API_URL}${API_ENDPOINT.createUser}`,
      {
        data: {
          email: generateUniqueEmail(),
          password: password,
        },
      }
    );

    const user1Body = await user1Response.json();
    const user1Token = user1Body.token;

    // Create request as user 1
    const createRequestResponse = await request.post(
      `${API_URL}${API_ENDPOINT.createRequest}`,
      {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
        data: {
          title: "User 1 Request",
          description: "Private request",
        },
      }
    );

    const requestBody = await createRequestResponse.json();
    const requestId = requestBody.id || requestBody.data?.id;

    // Create user 2
    const user2Response = await request.post(
      `${API_URL}${API_ENDPOINT.createUser}`,
      {
        data: {
          email: generateUniqueEmail(),
          password: password,
        },
      }
    );

    const user2Body = await user2Response.json();
    const user2Token = user2Body.token;

    // Try to access user 1's request as user 2
    const response = await request.get(
      `${API_URL}${API_ENDPOINT.getRequestById(requestId)}`,
      {
        headers: {
          Authorization: `Bearer ${user2Token}`,
        },
      }
    );
    
    expect([403, 404]).toContain(response.status());
  });
});
