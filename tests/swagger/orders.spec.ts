import { test, expect } from "@playwright/test";
import { faker } from "../../helpers/faker";

const BASE_URL = process.env.API_URL || "https://dev0pz.com/api";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;
const newEmail = () => faker.internet.email();

async function adminToken(request: any): Promise<string> {
  const res = await request.post(`${BASE_URL}/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const { access_token } = await res.json();
  return access_token;
}

/**
 * Creates an order and returns extracted fields from the nested response wrapper.
 * API response shape: { order: { orderId, orderNumber, ... }, customFields, address }
 */
async function createOrder(
  request: any,
  email?: string
): Promise<{ orderId: string; orderNumber: string; email: string }> {
  const orderEmail = email ?? newEmail();
  const res = await request.post(`${BASE_URL}/orders`, {
    data: { customerName: faker.person.fullName(), email: orderEmail },
  });
  const body = await res.json();
  return {
    orderId: body.order.orderId,
    orderNumber: body.order.orderNumber,
    email: orderEmail,
  };
}

// ─── POST /orders ─────────────────────────────────────────────────────────────

test.describe("POST /orders — creates order", () => {

  test("@swagger 201 creates order with valid customerName and email", async ({ request }) => {
    const email = newEmail();
    const customerName = faker.person.fullName();

    const res = await request.post(`${BASE_URL}/orders`, {
      data: { customerName, email },
    });
    const body = await res.json();

    expect(res.status()).toBe(201);
    // API response is wrapped: { order: { orderId, orderNumber, ... }, customFields, address }
    expect(body.order.orderId).toBeDefined();
    expect(body.order.orderNumber).toBeDefined();
    expect(body.order.customerName).toBe(customerName);
    expect(body.order.orderStatus).toBe("pending");
  });

  test("@swagger 201 creates order with optional address", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/orders`, {
      data: {
        customerName: faker.person.fullName(),
        email: newEmail(),
        address: {
          buildingType: "apartment",
          houseNumber: "42",
          street: "Lenin St",
          city: "Springfield",
          zipCode: "12345",
          state: "IL",
        },
      },
    });
    expect(res.status()).toBe(201);
  });

  test("@swagger 201 creates order with optional customFields", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/orders`, {
      data: {
        customerName: faker.person.fullName(),
        email: newEmail(),
        customFields: { priority: "high", source: "web" },
      },
    });
    expect(res.status()).toBe(201);
  });

  test("@swagger 400 rejects missing customerName", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/orders`, {
      data: { email: newEmail() },
    });
    expect(res.status()).toBe(400);
  });

  test("@swagger 400 rejects empty body", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/orders`, { data: {} });
    expect(res.status()).toBe(400);
  });

});

// ─── GET /orders ──────────────────────────────────────────────────────────────

test.describe("GET /orders — get all orders", () => {

  test("@swagger 200 returns array of orders", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/orders`);
    const body = await res.json();

    expect(res.status()).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

});

// ─── GET /orders/by-email ─────────────────────────────────────────────────────

test.describe("GET /orders/by-email — get orders by email", () => {

  test("@swagger 200 returns orders for a known email", async ({ request }) => {
    const email = newEmail();
    await createOrder(request, email);

    const res = await request.get(`${BASE_URL}/orders/by-email?email=${email}`);
    const body = await res.json();

    expect(res.status()).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    // Each item is wrapped: { order: { email, ... }, customFields, address }
    expect(body[0].order.email).toBe(email);
  });

  test.fixme("@swagger 404 returns 404 for email with no orders", async ({ request }) => {
    // API BUG: returns 200 with full order list instead of 404 when email has no orders
    const res = await request.get(`${BASE_URL}/orders/by-email?email=nobody_xyz@fake-domain.example`);
    expect(res.status()).toBe(404);
  });

  test.fixme("@swagger 400 returns 400 when email query param is missing", async ({ request }) => {
    // API BUG: returns 200 with all orders instead of 400 when param is missing
    const res = await request.get(`${BASE_URL}/orders/by-email`);
    expect(res.status()).toBe(400);
  });

});

// ─── GET /orders/by-ordernumber ───────────────────────────────────────────────

test.describe("GET /orders/by-ordernumber — get order by order number", () => {

  test("@swagger 200 returns order for a known order number", async ({ request }) => {
    const { orderNumber } = await createOrder(request);

    const res = await request.get(`${BASE_URL}/orders/by-ordernumber?orderNumber=${orderNumber}`);
    const body = await res.json();

    expect(res.status()).toBe(200);
    // Response is an array of wrappers: [{ order: { orderNumber, ... }, customFields, address }]
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].order.orderNumber).toBe(orderNumber);
  });

  test.fixme("@swagger 404 returns 404 for non-existent order number", async ({ request }) => {
    // API BUG: returns 200 instead of 404 for non-existent order number
    const res = await request.get(`${BASE_URL}/orders/by-ordernumber?orderNumber=ORD-00000000-XXXX`);
    expect(res.status()).toBe(404);
  });

});

// ─── GET /orders/{id} ────────────────────────────────────────────────────────

test.describe("GET /orders/{id} — get order by ID", () => {

  test("@swagger 200 returns order for a known ID", async ({ request }) => {
    const { orderId } = await createOrder(request);

    const res = await request.get(`${BASE_URL}/orders/${orderId}`);
    const body = await res.json();

    expect(res.status()).toBe(200);
    // Response: { order: { orderId, ... }, customFields, address }
    expect(body.order.orderId).toBe(orderId);
  });

  test("@swagger 404 returns 404 for non-existent order ID", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/orders/00000000-0000-0000-0000-000000000000`);
    expect(res.status()).toBe(404);
  });

});

// ─── PATCH /orders/{id} ──────────────────────────────────────────────────────

test.describe("PATCH /orders/{id} — update order", () => {

  test("@swagger 200 authorized user can update an order", async ({ request }) => {
    // Note: PATCH /orders/{id} uses 'authEmail' body field for ownership verification, NOT Bearer token
    const { orderId, email } = await createOrder(request);

    const res = await request.patch(`${BASE_URL}/orders/${orderId}`, {
      data: { customerName: "Updated Name", authEmail: email },
    });

    expect(res.status()).toBe(200);
  });

  test("@swagger 403 wrong authEmail is rejected", async ({ request }) => {
    const { orderId } = await createOrder(request);

    const res = await request.patch(`${BASE_URL}/orders/${orderId}`, {
      data: { customerName: "Hacked", authEmail: "hacker@evil.com" },
    });
    expect(res.status()).toBe(403);
  });

  test("@swagger 400 missing authEmail returns 400", async ({ request }) => {
    // API returns 400 (not 403) when authEmail field is absent from request body
    const { orderId } = await createOrder(request);

    const res = await request.patch(`${BASE_URL}/orders/${orderId}`, {
      data: { customerName: "No Auth" },
    });
    expect(res.status()).toBe(400);
  });

  test("@swagger 404 returns 404 for non-existent order ID", async ({ request }) => {
    const { email } = await createOrder(request);
    const res = await request.patch(`${BASE_URL}/orders/00000000-0000-0000-0000-000000000000`, {
      data: { customerName: "Ghost Order", authEmail: email },
    });
    expect(res.status()).toBe(404);
  });

});

// ─── DELETE /orders/{id} ─────────────────────────────────────────────────────

test.describe("DELETE /orders/{id} — delete order", () => {

  test("@swagger 200 authorized user can delete an order", async ({ request }) => {
    const { orderId } = await createOrder(request);
    const token = await adminToken(request);

    const res = await request.delete(`${BASE_URL}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test.fixme("@swagger 403 unauthenticated delete is rejected", async ({ request }) => {
    // API SECURITY BUG: DELETE /orders/{id} returns 200 with no authentication token at all
    const { orderId } = await createOrder(request);
    const res = await request.delete(`${BASE_URL}/orders/${orderId}`);
    expect(res.status()).toBe(403);
  });

  test("@swagger 404 returns 404 for non-existent order ID", async ({ request }) => {
    const token = await adminToken(request);
    const res = await request.delete(`${BASE_URL}/orders/00000000-0000-0000-0000-000000000000`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(404);
  });

});

// ─── PATCH /orders/{id}/status ───────────────────────────────────────────────

test.describe("PATCH /orders/{id}/status — update order status (admin)", () => {

  test("@swagger 200 admin can update order status to in-process", async ({ request }) => {
    const { orderId, orderNumber } = await createOrder(request);
    const token = await adminToken(request);

    const res = await request.patch(`${BASE_URL}/orders/${orderId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { orderNumber, orderStatus: "in-process" },
    });

    expect(res.status()).toBe(200);
  });

  test("@swagger 200 admin can update order status to completed", async ({ request }) => {
    const { orderId, orderNumber } = await createOrder(request);
    const token = await adminToken(request);

    const res = await request.patch(`${BASE_URL}/orders/${orderId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { orderNumber, orderStatus: "completed" },
    });

    expect(res.status()).toBe(200);
  });

  test("@swagger 400 rejects invalid status value", async ({ request }) => {
    const { orderId, orderNumber } = await createOrder(request);
    const token = await adminToken(request);

    const res = await request.patch(`${BASE_URL}/orders/${orderId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { orderNumber, orderStatus: "invalid-status" },
    });

    expect(res.status()).toBe(400);
  });

  test("@swagger 401 unauthenticated request is rejected", async ({ request }) => {
    // API returns 401 (not 403) when no Bearer token is provided
    const { orderId, orderNumber } = await createOrder(request);

    const res = await request.patch(`${BASE_URL}/orders/${orderId}/status`, {
      data: { orderNumber, orderStatus: "in-process" },
    });
    expect(res.status()).toBe(401);
  });

});

// ─── PATCH /orders/{id}/assign ───────────────────────────────────────────────

test.describe("PATCH /orders/{id}/assign — update order assignee (admin)", () => {

  test("@swagger 200 admin can assign an order to a person", async ({ request }) => {
    const { orderId, orderNumber } = await createOrder(request);
    const token = await adminToken(request);

    const res = await request.patch(`${BASE_URL}/orders/${orderId}/assign`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { orderNumber, assignedTo: "John Doe" },
    });

    expect(res.status()).toBe(200);
  });

  test("@swagger 400 rejects missing orderNumber", async ({ request }) => {
    const { orderId } = await createOrder(request);
    const token = await adminToken(request);

    const res = await request.patch(`${BASE_URL}/orders/${orderId}/assign`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { assignedTo: "John Doe" },
    });

    expect(res.status()).toBe(400);
  });

  test("@swagger 401 unauthenticated request is rejected", async ({ request }) => {
    // API returns 401 (not 403) when no Bearer token is provided
    const { orderId, orderNumber } = await createOrder(request);

    const res = await request.patch(`${BASE_URL}/orders/${orderId}/assign`, {
      data: { orderNumber, assignedTo: "John Doe" },
    });
    expect(res.status()).toBe(401);
  });

});
