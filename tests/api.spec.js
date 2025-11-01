import { test, expect } from '@playwright/test';
import { getHealth } from '../helpers/apiCalls.js';

test('health check API', async ({ request }) => {
  const response = await getHealth(request);

  expect(response.status()).toBe(200);
});