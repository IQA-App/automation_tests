import { test, expect, request } from '@playwright/test';
import { getEmailContent } from '../helpers/getEmailContentApi';
import { readFile } from 'fs/promises';

test('Test emails', async ({ request }) => {
    const searchEmail = 'test1@test.com';
    await getEmailContent({
        request: request,
        getEmail: searchEmail,
        retries: 3,
        timeout: 3000,
    });

    const confirmationCode = JSON.parse(
        await readFile('dynamicTestData/testData.json', 'utf8')
    ).confirmCode;

    console.log('=== CODE READ ===', confirmationCode);
    //  now we can use this code in /reset-password
});
