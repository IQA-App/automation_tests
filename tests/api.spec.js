import { test, expect } from '@playwright/test';
import { getHealth } from './apiCalls.js';

test('health check API', async ({ request }) => {
  const response = await getHealth(request);

  await expect(response.status()).toBe(200);
});