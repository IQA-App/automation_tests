import { test, expect } from '@playwright/test';
import { getHealth, createUser, loginAdmin, loginUser, getUser } from '../helpers/apiCalls.js';
import { CREDS } from '../testData.js';

const userEmail = CREDS.user.email;
const userPassword = CREDS.user.password;
let userId = '';
let authToken = '';
let newEmail = ''


test('health check API', async ({ request }) => {
  const response = await getHealth(request);
const body = await response.json();   
console.log('Response Body:', body);   
console.log('Status Code:', response.status())
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

test('5 Login admin through API', async ({ request }) => {
  const response = await request.post('https://dev0pz.com/api/auth/login', {
    data: {
      email: CREDS.admin.email,
      password: CREDS.admin.password,
    },
  });

  expect(response.status()).toBe(201);

});

test('Get user by ID ', async ({ request }) => {
  const response = await createUser(request, userEmail, userPassword);
  const body = await response.json();
  expect(response.status()).toBe(201);
  userId = body.user.id
  authToken = body.token
  expect (userId).toBeDefined()
  expect(authToken).toBeDefined()
  const res = await getUser (request, userId, authToken)
  const bodyGetUser = await res.json()
    console.log(bodyGetUser)
    expect (bodyGetUser.id).toEqual(userId)
    expect(bodyGetUser.email).toEqual(userEmail)

});

