import { test, expect } from '@playwright/test';
import { faker } from '../helpers/faker';
import { getEmailContent } from '../helpers/getEmailContentApi';
import { readFile, mkdir } from 'fs/promises';
import { CREDS } from '../testData';

const BASE_URL = process.env.API_URL;

test('full forgot-password flow: send code → read email → reset password', async ({ request }) => {
    test.skip(!process.env.EMAILS_URL || !process.env.API_KEY, 'EMAILS_URL and API_KEY must be set in .env to run this test');

    // 1. Create a fresh user
    const email = faker.internet.email();
    const password = CREDS.user.password;
    const newPassword = 'NewPass456Qq!';

    const createRes = await request.post(`${BASE_URL}/user`, {
        data: { email, password },
    });
    expect(createRes.status(), `Failed to create user: ${await createRes.text()}`).toBe(201);
    console.log('=== CREATED USER ===', email);

    // 2. Trigger forgot-password to send the confirmation code email
    const forgotRes = await request.post(`${BASE_URL}/auth/forgot-password`, {
        data: { email },
    });
    expect(forgotRes.status(), `Forgot-password failed: ${await forgotRes.text()}`).toBe(201);
    console.log('=== FORGOT PASSWORD SENT ===');

    // 3. Ensure the output directory exists and fetch the email with the code
    await mkdir('dynamicTestData', { recursive: true });
    await getEmailContent({
        request,
        getEmail: email,
        retries: 5,
        timeout: 4000,
    });

    // 4. Read the confirmation code saved by getEmailContent
    const confirmationCode = JSON.parse(
        await readFile('dynamicTestData/testData.json', 'utf8')
    ).confirmCode;
    console.log('=== CODE READ ===', confirmationCode);

    // 5. Use the code to reset the password
    const resetRes = await request.patch(`${BASE_URL}/auth/reset-password`, {
        data: {
            email,
            confirmationCode,
            newPassword,
            confirmPassword: newPassword,
        },
    });
    expect(resetRes.status(), `Reset password failed: ${await resetRes.text()}`).toBe(200);
    console.log('=== PASSWORD RESET SUCCESSFUL ===');

    // 6. Verify new credentials work
    const loginRes = await request.post(`${BASE_URL}/auth/login`, {
        data: { email, password: newPassword },
    });
    expect(loginRes.status()).toBe(201);
    const { access_token } = await loginRes.json();
    expect(access_token).toBeDefined();
    console.log('=== LOGIN WITH NEW PASSWORD SUCCESSFUL ===');
});
