import { writeFile } from 'fs/promises';
import { expect } from 'playwright/test';

export async function getEmailContent({ request, retries, getEmail, timeout }) {
    const token = process.env.API_KEY;
    const url = process.env.EMAILS_URL;
    let attempts = 0;

    const response = async () => {
        attempts++;

        await request
            .get(url, {
                headers: {
                    Authorization: 'Token ' + token,
                },
            })
            .then(async (res) => {
                const responseStatus = await res.status();
                const body = await res.json();
                const emailsArray = body.results.filter((email) =>
                    email.preview_text.includes(getEmail)
                );

                if (responseStatus === 200 && emailsArray.length > 0) {
                    console.log('=== ALL EMAILS ===', emailsArray);
                    const stringCode = emailsArray[0].preview_text;

                    const confirmationCode = stringCode
                        .split('your code is :')[1]
                        .slice(0, 6);
                    console.log('=== CODE ===', confirmationCode);

                    writeFile(
                        'dynamicTestData/testData.json',
                        JSON.stringify({
                            confirmCode: confirmationCode,
                        })
                    );
                }
                if (responseStatus !== 200 && attempts < retries) {
                    await page.waitForTimeout(timeout);
                    return await response();
                } else if (
                    attempts == retries &&
                    responseStatus != 200 &&
                    emailsArray.length === 0
                ) {
                    throw new Error('Email service error');
                }
            });
    };

    return await response();
}
