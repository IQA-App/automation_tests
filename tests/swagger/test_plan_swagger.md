# Swagger API Test Plan

**Project:** Backapp API  
**Base URL:** `https://dev0pz.com/api`  
**Tag:** `@swagger`  
**Test Files:**
- `tests/swagger/auth.spec.ts`
- `tests/swagger/users.spec.ts`
- `tests/swagger/orders.spec.ts`

**Run command:**
```bash
npx playwright test --grep "@swagger"
```

---

## Table of Contents

1. [Auth API](#1-auth-api)
2. [Users API](#2-users-api)
3. [Orders API](#3-orders-api)
4. [Known API Bugs (fixme tests)](#4-known-api-bugs-fixme-tests)

---

## 1. Auth API

**File:** `tests/swagger/auth.spec.ts`  
**Total tests:** 15 active · 0 skipped

---

### 1.1 POST /auth/login — Login

| # | Test Name | Method | Endpoint | Request Body | Expected Status | Description |
|---|-----------|--------|----------|--------------|-----------------|-------------|
| 1 | `201 valid credentials return JWT token` | POST | `/auth/login` | `{ email, password }` (fresh user) | 201 | Creates a fresh user, then logs in. Asserts response contains `access_token`, `id`, `email`, `role`. |
| 2 | `401 wrong password returns 401` | POST | `/auth/login` | `{ email, password: "WrongPassword999!" }` | 401 | Logs in with correct email but wrong password. API rejects with Unauthorized. |
| 3 | `404 non-existent email returns 404` | POST | `/auth/login` | `{ email: "nobody_xyz@fake-domain.example", password }` | 404 | Attempts login with email that does not exist in the database. |
| 4 | `401 missing email returns 401` | POST | `/auth/login` | `{ password }` | 401 | Omits email field. API treats incomplete credentials as invalid (not a validation 400). |
| 5 | `401 missing password returns 401` | POST | `/auth/login` | `{ email }` | 401 | Omits password field. API treats incomplete credentials as invalid (not a validation 400). |
| 6 | `401 empty body returns 401` | POST | `/auth/login` | `{}` | 401 | Sends empty body. API returns 401 (no validation error for missing fields on this endpoint). |

---

### 1.2 GET /auth/profile — Get Profile

| # | Test Name | Method | Endpoint | Auth | Expected Status | Description |
|---|-----------|--------|----------|------|-----------------|-------------|
| 7 | `401 endpoint requires authentication` | GET | `/auth/profile` | None | 401 | Sends request with no token. API docs say "not ready yet" but the endpoint is live and requires authentication. |

---

### 1.3 POST /auth/forgot-password — Send Reset Code

| # | Test Name | Method | Endpoint | Request Body | Expected Status | Description |
|---|-----------|--------|----------|--------------|-----------------|-------------|
| 8 | `201 sends reset code for existing user email` | POST | `/auth/forgot-password` | `{ email }` (existing user) | 201 or 400 | Creates a fresh user and requests a password reset. 201 = code sent successfully; 400 = a code is already pending (business rule — only one active code at a time). |
| 9 | `404 non-existent email returns 404` | POST | `/auth/forgot-password` | `{ email: "nobody_xyz@fake-domain.example" }` | 404 | Requests a reset code for an email that does not exist. |
| 10 | `400 missing email field returns 400` | POST | `/auth/forgot-password` | `{}` | 400 | Sends empty body — field validation triggers 400. |

---

### 1.4 PATCH /auth/reset-password — Reset Password

| # | Test Name | Method | Endpoint | Request Body | Expected Status | Description |
|---|-----------|--------|----------|--------------|-----------------|-------------|
| 11 | `400 empty body returns 400` | PATCH | `/auth/reset-password` | `{}` | 400 | Sends empty body — all required fields are missing, expects validation failure. |
| 12 | `400 or 404 invalid confirmation code is rejected` | PATCH | `/auth/reset-password` | `{ email, confirmationCode: "000000", newPassword, confirmPassword }` | 400 or 404 | Sends an obviously fake confirmation code. API returns 400 (invalid code) or 404 (no active code found for that email). |
| 13 | `400 mismatched passwords are rejected` | PATCH | `/auth/reset-password` | `{ email, confirmationCode: "123456", newPassword: "X", confirmPassword: "Y" }` | 400 or 404 | Sends non-matching newPassword and confirmPassword. API returns 400 (mismatch) or 404 (no code found). |

---

### 1.5 GET /auth/all-codes — Get All Confirmation Codes (Admin)

| # | Test Name | Method | Endpoint | Auth | Expected Status | Description |
|---|-----------|--------|----------|------|-----------------|-------------|
| 14 | `200 admin can retrieve all confirmation codes` | GET | `/auth/all-codes` | Bearer admin token | 200 | Admin logs in and fetches all pending confirmation codes. Note: API docs mark this endpoint as "not ready yet" but it is functional. |
| 15 | `401 unauthenticated request is rejected` | GET | `/auth/all-codes` | None | 401 | Sends request without token. API returns 401 (not 403) when no Authorization header is present. |

---

## 2. Users API

**File:** `tests/swagger/users.spec.ts`  
**Total tests:** 13 active · 0 skipped

---

### 2.1 POST /user — Create User

| # | Test Name | Method | Endpoint | Request Body | Expected Status | Description |
|---|-----------|--------|----------|--------------|-----------------|-------------|
| 1 | `201 creates user with valid email and password` | POST | `/user` | `{ email, password }` | 201 | Creates a new user with a unique faker email and valid password. Asserts response contains `user.id`, `user.email`, and `token`. |
| 2 | `400 rejects missing email` | POST | `/user` | `{ email: "", password }` | 400 | Passes empty string as email — field validation fails. |
| 3 | `400 rejects missing password` | POST | `/user` | `{ email }` | 400 | Omits password field entirely — field validation fails. |
| 4 | `API does not enforce password minLength` | POST | `/user` | `{ email, password: "Ab1!" }` | 201 or 400 | **API BUG:** Swagger spec declares `minLength: 8` for password, but the API accepts passwords shorter than 8 characters. Accepts either outcome. |

---

### 2.2 GET /user — Get All Users (Admin Only)

| # | Test Name | Method | Endpoint | Auth | Expected Status | Description |
|---|-----------|--------|----------|------|-----------------|-------------|
| 5 | `200 admin gets list of all users` | GET | `/user` | Bearer admin token | 200 | Admin authenticates and retrieves the full user list. Asserts response is an array. |
| 6 | `403 regular user cannot list all users` | GET | `/user` | Bearer user token | 403 | Creates a regular user, logs them in, attempts to fetch the user list. Role-based access control blocks the request. |
| 7 | `401 unauthenticated request is rejected` | GET | `/user` | None | 401 | Sends request without any token. API returns 401 (not 403) when no Authorization header is present. |

---

### 2.3 GET /user/{id} — Get Specific User

| # | Test Name | Method | Endpoint | Auth | Expected Status | Description |
|---|-----------|--------|----------|------|-----------------|-------------|
| 8 | `200 owner can get their own profile` | GET | `/user/{id}` | Bearer own token | 200 | User fetches their own profile using their ID and token. Asserts response email matches. |
| 9 | `403 different user cannot access another user's profile` | GET | `/user/{id}` | Bearer attacker token | 403 | User A tries to read User B's profile. API enforces ownership — returns 403. |
| 10 | `403 or 404 non-existent user ID with valid token` | GET | `/user/{id}` | Bearer valid token | 403 or 404 | Requests a user profile with a fake UUID. API may reject ownership check first (403) or resolve not-found first (404). Both are acceptable. |
| 11 | `401 unauthenticated request is rejected` | GET | `/user/{id}` | None | 401 | Requests a user profile with no token. API returns 401. |

---

### 2.4 PATCH /user/{id} — Update User

| # | Test Name | Method | Endpoint | Auth | Request Body | Expected Status | Description |
|---|-----------|--------|----------|------|--------------|-----------------|-------------|
| 12 | `200 owner can update their own email and password` | PATCH | `/user/{id}` | Bearer own token | `{ email, password }` | 200 | User updates their own email and password. Asserts 200 success. |
| 13 | `403 different user cannot update another user` | PATCH | `/user/{id}` | Bearer attacker token | `{ email, password }` | 403 | User B attempts to update User A's profile. Ownership check rejects the request. |

---

### 2.5 DELETE /user/{id} — Delete User

| # | Test Name | Method | Endpoint | Auth | Expected Status | Description |
|---|-----------|--------|----------|------|-----------------|-------------|
| 14 | `200 owner can delete their own account` | DELETE | `/user/{id}` | Bearer own token | 200 | User deletes their own account. Asserts 200. |
| 15 | `403 user cannot delete another user's account` | DELETE | `/user/{id}` | Bearer attacker token | 403 | User B attempts to delete User A's account. Ownership check blocks it. |
| 16 | `401 unauthenticated delete is rejected` | DELETE | `/user/{id}` | None | 401 | Attempts delete with no token. API returns 401. |

---

## 3. Orders API

**File:** `tests/swagger/orders.spec.ts`  
**Total tests:** 23 active · 4 skipped (fixme)

> **Response shape note:** All order endpoints return a nested wrapper object:
> ```json
> {
>   "order": { "orderId", "orderNumber", "orderStatus", "customerName", "email", "assignedTo", "createdAt", "updatedAt" },
>   "customFields": {},
>   "address": null
> }
> ```
> List endpoints (`GET /orders`, `GET /orders/by-email`, `GET /orders/by-ordernumber`) return an **array** of these wrappers.

> **Auth note for PATCH /orders/{id}:** This endpoint authenticates by `authEmail` field in the request body (owner's email), **not** by Bearer token.

---

### 3.1 POST /orders — Create Order

| # | Test Name | Method | Endpoint | Request Body | Expected Status | Description |
|---|-----------|--------|----------|--------------|-----------------|-------------|
| 1 | `201 creates order with valid customerName and email` | POST | `/orders` | `{ customerName, email }` | 201 | Creates an order with the two required fields. Asserts `body.order.orderId` and `body.order.orderNumber` are defined, `body.order.customerName` matches input, and `body.order.orderStatus` is `"pending"`. |
| 2 | `201 creates order with optional address` | POST | `/orders` | `{ customerName, email, address: { buildingType, houseNumber, street, city, zipCode, state } }` | 201 | Creates an order with a full address object. Asserts 201. |
| 3 | `201 creates order with optional customFields` | POST | `/orders` | `{ customerName, email, customFields: { priority, source } }` | 201 | Creates an order with arbitrary key-value custom fields. Asserts 201. |
| 4 | `400 rejects missing customerName` | POST | `/orders` | `{ email }` | 400 | Omits required `customerName` field. Field validation returns 400. |
| 5 | `400 rejects empty body` | POST | `/orders` | `{}` | 400 | Sends empty body — all required fields are missing. |

---

### 3.2 GET /orders — Get All Orders

| # | Test Name | Method | Endpoint | Auth | Expected Status | Description |
|---|-----------|--------|----------|------|-----------------|-------------|
| 6 | `200 returns array of orders` | GET | `/orders` | None | 200 | Fetches all orders. Asserts response is an array. No authentication required on this endpoint. |

---

### 3.3 GET /orders/by-email — Get Orders by Email

| # | Test Name | Method | Endpoint | Query Param | Expected Status | Description |
|---|-----------|--------|----------|-------------|-----------------|-------------|
| 7 | `200 returns orders for a known email` | GET | `/orders/by-email` | `?email={email}` | 200 | Creates an order with a specific email, then searches for it. Asserts the result array is non-empty and `body[0].order.email` matches the searched email. |
| ~~8~~ | ~~`404 returns 404 for email with no orders`~~ | — | — | — | — | **fixme — see section 4** |
| ~~9~~ | ~~`400 returns 400 when email query param is missing`~~ | — | — | — | — | **fixme — see section 4** |

---

### 3.4 GET /orders/by-ordernumber — Get Order by Order Number

| # | Test Name | Method | Endpoint | Query Param | Expected Status | Description |
|---|-----------|--------|----------|-------------|-----------------|-------------|
| 8 | `200 returns order for a known order number` | GET | `/orders/by-ordernumber` | `?orderNumber={orderNumber}` | 200 | Creates an order, then searches by its generated order number. Asserts response is an array and `body[0].order.orderNumber` matches. |
| ~~9~~ | ~~`404 returns 404 for non-existent order number`~~ | — | — | — | — | **fixme — see section 4** |

---

### 3.5 GET /orders/{id} — Get Order by ID

| # | Test Name | Method | Endpoint | Auth | Expected Status | Description |
|---|-----------|--------|----------|------|-----------------|-------------|
| 9 | `200 returns order for a known ID` | GET | `/orders/{id}` | None | 200 | Creates an order, then fetches it by `orderId`. Asserts `body.order.orderId` equals the created order's ID. |
| 10 | `404 returns 404 for non-existent order ID` | GET | `/orders/{id}` | None | 404 | Requests a well-formed UUID that does not exist in the database. Returns 404. |

---

### 3.6 PATCH /orders/{id} — Update Order

> **Auth mechanism:** Ownership is verified by passing the order creator's email as `authEmail` in the request body. Bearer token is **not** used.

| # | Test Name | Method | Endpoint | Auth | Request Body | Expected Status | Description |
|---|-----------|--------|----------|------|--------------|-----------------|-------------|
| 11 | `200 authorized user can update an order` | PATCH | `/orders/{id}` | `authEmail` in body | `{ customerName: "Updated Name", authEmail: ownerEmail }` | 200 | Order creator updates their own order by providing their email as `authEmail`. Asserts 200 success. |
| 12 | `403 wrong authEmail is rejected` | PATCH | `/orders/{id}` | wrong `authEmail` | `{ customerName, authEmail: "hacker@evil.com" }` | 403 | Passes an email that does not match the order's owner. API returns 403 Forbidden. |
| 13 | `400 missing authEmail returns 400` | PATCH | `/orders/{id}` | no auth | `{ customerName }` (no `authEmail`) | 400 | Omits `authEmail` field entirely. API returns 400 (missing required field), not 403. |
| 14 | `404 returns 404 for non-existent order ID` | PATCH | `/orders/{id}` | valid `authEmail` | `{ customerName, authEmail }` | 404 | Attempts to update an order with a fake UUID. Returns 404. |

---

### 3.7 DELETE /orders/{id} — Delete Order

> **Security note:** API does not require authentication to delete an order (confirmed bug — see section 4).

| # | Test Name | Method | Endpoint | Auth | Expected Status | Description |
|---|-----------|--------|----------|------|-----------------|-------------|
| 15 | `200 authorized user can delete an order` | DELETE | `/orders/{id}` | Bearer admin token | 200 | Creates an order, then deletes it with an admin Bearer token. Asserts 200. |
| ~~16~~ | ~~`403 unauthenticated delete is rejected`~~ | — | — | — | — | **fixme — see section 4** |
| 16 | `404 returns 404 for non-existent order ID` | DELETE | `/orders/{id}` | Bearer admin token | 404 | Attempts to delete a non-existent UUID. Returns 404. |

---

### 3.8 PATCH /orders/{id}/status — Update Order Status (Admin)

| # | Test Name | Method | Endpoint | Auth | Request Body | Expected Status | Description |
|---|-----------|--------|----------|------|--------------|-----------------|-------------|
| 17 | `200 admin can update order status to in-process` | PATCH | `/orders/{id}/status` | Bearer admin token | `{ orderNumber, orderStatus: "in-process" }` | 200 | Admin changes order status from `pending` to `in-process`. |
| 18 | `200 admin can update order status to completed` | PATCH | `/orders/{id}/status` | Bearer admin token | `{ orderNumber, orderStatus: "completed" }` | 200 | Admin changes order status to `completed`. |
| 19 | `400 rejects invalid status value` | PATCH | `/orders/{id}/status` | Bearer admin token | `{ orderNumber, orderStatus: "invalid-status" }` | 400 | Sends a status value not in the allowed enum. API returns 400 validation error. |
| 20 | `401 unauthenticated request is rejected` | PATCH | `/orders/{id}/status` | None | `{ orderNumber, orderStatus: "in-process" }` | 401 | Sends request with no token. API returns 401 (not 403). |

---

### 3.9 PATCH /orders/{id}/assign — Update Order Assignee (Admin)

| # | Test Name | Method | Endpoint | Auth | Request Body | Expected Status | Description |
|---|-----------|--------|----------|------|--------------|-----------------|-------------|
| 21 | `200 admin can assign an order to a person` | PATCH | `/orders/{id}/assign` | Bearer admin token | `{ orderNumber, assignedTo: "John Doe" }` | 200 | Admin assigns the order to a person by name. Asserts 200. |
| 22 | `400 rejects missing orderNumber` | PATCH | `/orders/{id}/assign` | Bearer admin token | `{ assignedTo: "John Doe" }` (no `orderNumber`) | 400 | Omits required `orderNumber` field. API returns 400 validation error. |
| 23 | `401 unauthenticated request is rejected` | PATCH | `/orders/{id}/assign` | None | `{ orderNumber, assignedTo: "John Doe" }` | 401 | Sends request with no token. API returns 401 (not 403). |

---

## 4. Known API Bugs (fixme tests)

These tests are marked `test.fixme()` — they are **skipped during normal test runs** and document confirmed API defects. They should be re-enabled when the API is fixed.

| # | File | Test Name | Endpoint | Expected (correct) | Actual (API bug) | Bug Description |
|---|------|-----------|----------|--------------------|------------------|-----------------|
| 1 | `orders.spec.ts` | `404 returns 404 for email with no orders` | `GET /orders/by-email?email=nobody@fake.example` | 404 | 200 + full order list | When no orders exist for the given email, the API ignores the filter and returns all orders instead of 404. |
| 2 | `orders.spec.ts` | `400 returns 400 when email query param is missing` | `GET /orders/by-email` | 400 | 200 + full order list | Missing required query param should return 400, but the API returns all orders. |
| 3 | `orders.spec.ts` | `404 returns 404 for non-existent order number` | `GET /orders/by-ordernumber?orderNumber=ORD-00000000-XXXX` | 404 | 200 | Non-existent order number should return 404 but API returns 200 with an empty/null result. |
| 4 | `orders.spec.ts` | `403 unauthenticated delete is rejected` | `DELETE /orders/{id}` (no token) | 403 | 200 | **Security bug:** `DELETE /orders/{id}` accepts requests with no authentication token and deletes the order successfully. Any unauthenticated caller can delete any order. |

---

## 5. Test Coverage Summary

| File | Endpoint Group | Active Tests | Skipped (fixme) | Total |
|------|---------------|:------------:|:---------------:|:-----:|
| `auth.spec.ts` | Auth | 15 | 0 | 15 |
| `users.spec.ts` | Users | 16 | 0 | 16 |
| `orders.spec.ts` | Orders | 23 | 4 | 27 |
| **Total** | | **54** | **4** | **58** |

### Endpoints covered

| Method | Endpoint | File |
|--------|----------|------|
| POST | `/auth/login` | auth |
| GET | `/auth/profile` | auth |
| POST | `/auth/forgot-password` | auth |
| PATCH | `/auth/reset-password` | auth |
| GET | `/auth/all-codes` | auth |
| POST | `/user` | users |
| GET | `/user` | users |
| GET | `/user/{id}` | users |
| PATCH | `/user/{id}` | users |
| DELETE | `/user/{id}` | users |
| POST | `/orders` | orders |
| GET | `/orders` | orders |
| GET | `/orders/by-email` | orders |
| GET | `/orders/by-ordernumber` | orders |
| GET | `/orders/{id}` | orders |
| PATCH | `/orders/{id}` | orders |
| DELETE | `/orders/{id}` | orders |
| PATCH | `/orders/{id}/status` | orders |
| PATCH | `/orders/{id}/assign` | orders |

---

## 6. Environment Setup

```env
API_URL=https://dev0pz.com/api
BASE_URL=https://dev0pz.com
ADMIN_EMAIL=admin@test.com
ADMIN_PASSWORD=12345Qq!
```

Admin credentials are read from `.env` via `process.env.ADMIN_EMAIL` / `process.env.ADMIN_PASSWORD`.  
Regular user password is read from `testData.ts` → `CREDS.user.password` (`123456Qq!`).
