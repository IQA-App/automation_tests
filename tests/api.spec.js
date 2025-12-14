import { test, expect } from "@playwright/test";
import {
  getHealth,
  createUser,
  loginAdmin,
  loginUser,
  getUser,
  deleteUser,
} from "../helpers/apiCalls.js";
import { CREDS } from "../testData.js";

const userEmail = CREDS.user.email;
const userPassword = CREDS.user.password;
let userId = "";
let authToken = "";
let newEmail = "";

test("health check API", async ({ request }) => {
  const response = await getHealth(request);
  const body = await response.json();
  console.log("Response Body:", body);
  console.log("Status Code:", response.status());
  expect(response.status()).toBe(200);
});

test("Create user through API", async ({ request }) => {
  const response = await createUser(request, userEmail, userPassword);
  
  expect(response.status()).toBe(201);
});

test("Login user through API", async ({ request }) => {
  const response = await loginUser(request, userEmail, userPassword);

  expect(response.status()).toBe(201);
});

test("Get user by ID ", async ({ request }) => {
  const response = await createUser(request, userEmail, userPassword);
  const body = await response.json();
  expect(response.status()).toBe(201);
  userId = body.user.id;
  authToken = body.token;
  expect(userId).toBeDefined();
  expect(authToken).toBeDefined();
  const res = await getUser(request, userId, authToken);
  const bodyGetUser = await res.json();
  console.log(bodyGetUser);
  expect(bodyGetUser.id).toEqual(userId);
  expect(bodyGetUser.email).toEqual(userEmail);
});

test("Delete User By Id", async ({ request }) => {
  const response = await createUser(request, userEmail, userPassword);
  const body = await response.json();

  expect(response.status()).toBe(201);

  userId = body.user.id;
  authToken = body.token;

  expect(userId).toBeDefined();
  expect(authToken).toBeDefined();

  await deleteUser(request, userId, authToken);
  await expect(async () => {
    await getUser(request, userId, authToken);
      expect(response.status()).toBe(200);

  }).rejects.toThrow();
});
