import { API_ENDPOINT }
 from '../testData.js';

export async function getHealth(request) {
    const response = await request.get(`${process.env.API_URL}${API_ENDPOINT.getHealth}`);
    if (response.status() !== 200) {
        throw new Error(`Health check failed with status: ${response.status()}`);
    }
    return response;
}
