import { API_ENDPOINT } from '../testData';

const BASE_URL = process.env.API_URL;

export async function getHealth(request: any) {
    const response = await request.get(`${BASE_URL}${API_ENDPOINT.getHealth}`);
    if (response.status() !== 200) {
        throw new Error(`Health check failed with status: ${response.status()}`);
    }
    console.log('Health check passed');
    return response;
}

export async function createUser(request: any, email: string, password: string) {
    const response = await request.post(`${BASE_URL}${API_ENDPOINT.createUser}`, {
        data: { email, password },
    });
    if (response.status() !== 201) {
        throw new Error(`User creation failed with status: ${response.status()}`);
    }
    console.log('User created successfully');
    return response;
}

export async function loginUser(request: any, email: string, password: string) {
    const response = await request.post(`${BASE_URL}${API_ENDPOINT.login}`, {
        data: { email, password },
    });
    if (![200, 201].includes(response.status())) {
        throw new Error(`User login failed with status: ${response.status()}`);
    }
    console.log('User logged in successfully');
    return response;
}
export async function loginAdmin(request: any, email: string, password: string) {
    const response = await request.post(`${BASE_URL}${API_ENDPOINT.login}`, {
        data: { email, password },
    });
    if (![200, 201].includes(response.status())) {
        throw new Error(`Admin login failed with status: ${response.status()}`);
    }
    console.log('Admin logged in successfully');
    return response;
}

export async function getUserList(request: any, token: string) {
    const response = await request.get(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status() !== 200) {
        throw new Error(`Get user list failed with status: ${response.status()}`);
    }
    console.log('User list retrieved successfully');
    return response;
}

export async function getUser(request: any, userId: string, authToken: string) {
    const response = await request.get(`${BASE_URL}/user/${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
    });
    if (response.status() !== 200) {
        throw new Error(`Get user failed with status: ${response.status()}`);
    }
    console.log('User retrieved successfully');
    return response;
}

export async function updateUser(request: any, userId: string, authToken: string, email: string, password: string) {
    const response = await request.patch(`${BASE_URL}/user/${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { email, password },
    });
    if (response.status() !== 200) {
        throw new Error(`Update user failed with status: ${response.status()}`);
    }
    console.log('User updated successfully');
    return response;
}

export async function deleteUser(request: any, userId: string, authToken: string) {
    const response = await request.delete(`${BASE_URL}/user/${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
    });
    if (![200, 204].includes(response.status())) {
        throw new Error(`Delete user failed with status: ${response.status()}`);
    }
    console.log('User deleted successfully');
    return response;
}
