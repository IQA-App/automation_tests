# Swagger API Tests

Tests based on the real OpenAPI spec fetched /docs-json.  
All 20 endpoints across 4 groups are covered.

---

## Files

| File | Group | Endpoints | Tests |
|---|---|---|---|
| `users.spec.ts` | user | 5 | 15 |
| `auth.spec.ts` | auth | 5 | 15 |
| `orders.spec.ts` | orders | 9 + health | 22 |

---

## Endpoints

### users.spec.ts

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/user` | No | Create user |
| GET | `/user` | Admin | Get all users |
| GET | `/user/{id}` | Owner | Get user by ID |
| PATCH | `/user/{id}` | Owner | Update user |
| DELETE | `/user/{id}` | Owner | Delete user |

### auth.spec.ts

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | No | Login, returns JWT |
| GET | `/auth/profile` | No | Get profile *(not ready)* |
| POST | `/auth/forgot-password` | No | Send password reset code |
| PATCH | `/auth/reset-password` | No | Reset password with code |
| GET | `/auth/all-codes` | Admin | Get all confirmation codes *(not ready)* |

### orders.spec.ts

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/orders` | No | Create order |
| GET | `/orders` | No | Get all orders |
| GET | `/orders/by-email` | No | Get orders by email (query param) |
| GET | `/orders/by-ordernumber` | No | Get order by order number (query param) |
| GET | `/orders/{id}` | No | Get order by ID |
| PATCH | `/orders/{id}` | Owner | Update order |
| DELETE | `/orders/{id}` | Owner | Delete order |
| PATCH | `/orders/{id}/status` | Admin | Update order status |
| PATCH | `/orders/{id}/assign` | Admin | Assign order to a person |

---

## Running the Tests

```bash
# all swagger tests
npx playwright test tests/swagger/ --reporter=list

# single file
npx playwright test tests/swagger/users.spec.ts
npx playwright test tests/swagger/auth.spec.ts
npx playwright test tests/swagger/orders.spec.ts

# by tag
npx playwright test --grep @swagger
```

---

## Key Data

**Admin credentials** — `CREDS.admin` in `testData.ts`  
```
email:    admin@test.com
password: 123456qQ!
```

**User password** — `CREDS.user.password` in `testData.ts`  
```
password: 123456Qq!
```

**Order statuses**: `pending` | `in-process` | `completed`  
**User roles**: `user` | `admin` | `customer` | `dispatch` | `technician`

---

## Notes

- `GET /auth/profile` and `GET /auth/all-codes` are marked *"not ready yet"* in the API docs but are tested to confirm they respond with the status codes declared in the spec.
- Password reset tests use a placeholder confirmation code since real email delivery cannot be verified in integration tests — error-path behaviour is asserted instead.
- Each test file is self-contained: no shared helper modules beyond `faker` and `testData`.
