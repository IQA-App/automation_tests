import { writeFile } from 'fs/promises';

type GetEmailContentOptions = {
    request: any;
    retries: number;
    getEmail: string;
    timeout: number;
};

export async function getEmailContent({ request, retries, getEmail, timeout }: GetEmailContentOptions) {
    const token = process.env.API_KEY;
    const url = process.env.EMAILS_URL;

    if (!url) throw new Error('EMAILS_URL is not set in .env');
    if (!token) throw new Error('API_KEY is not set in .env');

    let attempts = 0;

    const response = async (): Promise<void> => {
        attempts++;

        const res = await request.get(url, {
            headers: { Authorization: 'Token ' + token },
        });

        const responseStatus = res.status();
        const body = await res.json();

        if (responseStatus !== 200) {
            if (attempts < retries) {
                await new Promise((resolve) => setTimeout(resolve, timeout));
                return response();
            }
            throw new Error(`Email service returned ${responseStatus}`);
        }

        const emailsArray = body.results.filter((email: any) =>
            email.preview_text.includes(getEmail)
        );

        if (emailsArray.length > 0) {
            console.log('=== ALL EMAILS ===', emailsArray);
            const stringCode = emailsArray[0].preview_text;
            const confirmationCode = stringCode.split('your code is :')[1].slice(0, 6);
            console.log('=== CODE ===', confirmationCode);

            await writeFile(
                'dynamicTestData/testData.json',
                JSON.stringify({ confirmCode: confirmationCode })
            );
            return;
        }

        // Email not found yet — retry if attempts remain
        if (attempts < retries) {
            await new Promise((resolve) => setTimeout(resolve, timeout));
            return response();
        }

        throw new Error(`Email for "${getEmail}" not found after ${retries} attempts`);
    };

    return response();
}
