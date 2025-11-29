import { test, expect } from '@playwright/test';
import { getHealth, createUser, loginAdmin, loginUser } from '../helpers/apiCalls.js';
import { CREDS } from '../testData.js';

const userEmail = CREDS.user.email;
const userPassword = CREDS.user.password;

test('health check API', async ({ request }) => {
  const response = await getHealth(request);

  expect(response.status()).toBe(200);
});

test('Create user through API', async ({ request }) => {
  const response = await createUser(request, userEmail, userPassword);

  expect(response.status()).toBe(201);
});

  test('Login user through API', async ({ request }) => {
  const response = await loginUser(
    request,
    userEmail,
    userPassword,
  );

  expect(response.status()).toBe(201);
  });

  test('Login admin through API', async ({ request }) => {
    const response = await loginUser(
      request,
      CREDS.admin.email,
      CREDS.admin.password,
    );
    expect(response.status()).toBe(201);
    });