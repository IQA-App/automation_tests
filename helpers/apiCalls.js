import { API_ENDPOINT } from '../testData.js';

let token = '';

export async function getHealth(request) {
const url = `${process.env.API_URL}${API_ENDPOINT.getHealth}`;
    const response = await request.get(url);
    if (response.status() !== 200) {
        throw new Error(`Health check failed with status: ${response.status()}`);
    }
    console.log('Health check passed');
    return response;
}

export async function createUser(request, email, password) {

    const payload = {
        email: email,
        password: password
    }
    const url = `${process.env.API_URL}${API_ENDPOINT.createUser}`;
    const response = await request.post(url, {
        data: payload
    });


    if (response.status() !== 201) {
        throw new Error(`User creation failed with status: ${response.status()}`);
    }
    console.log('User created successfully');
    return response;
}

export async function loginUser(request, email, password) {
    const payload = {
      email,
      password
    }
    const url = `${process.env.API_URL}${API_ENDPOINT.login}`;
  const response = await request.post(url, {
    data: payload
  });

      if (response.status() !== 201) {
        throw new Error(`User login failed with status: ${response.status()}`);
    }
    console.log('User logged in successfully');

  return response;
}
export async function loginAdmin(request, email, password) {
    const payload = {
        email: email,
        password: password
    }
    const response = await request.post(`https://dev0pz.com/api/user/login`, { data: payload });
    console.log(response);
    if (response.status() !== 201) {
        throw new Error(`Login failed with status: ${response.status()}`);
    }
    const body = await response.json();
    console.log(body);

    token = body.access_token
//     const userId = body.id

// //    token = body?.token || body?.accessToken || body?.access_token || body?.data?.token || body?.data?.accessToken;
//     if (!token) {
//         throw new Error('Token not found in login response');
//     }
//     console.log('Admin login successful');
    return response;
}

export async function getUserList(request, token) {
    const response = await request.get(`https://dev0pz.com/api/users`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });
    if (response.status() !== 200) {
        throw new Error(`Get user list failed with status: ${response.status()}`);
    }
    console.log('User list retrieved successfully');
    return response;
}

export async function getUser(request, userId, authToken) {
    const response = await request.get(`https://dev0pz.com/api/user/${userId}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });
    if (response.status() !== 200) {
        throw new Error(`Get user failed with status: ${response.status()}`);
    }
    console.log('User retrieved successfully');
    return response;
}

export async function updateUser(request, userId, authToken, email, password) {
    const payload = {
        email: email,
        password: password
    };
    const response = await request.put(`https://dev0pz.com/api/user/${userId}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        data: payload
    });
    if (response.status() !== 200) {
        throw new Error(`Update user failed with status: ${response.status()}`);
    }
    console.log('User updated successfully');
    return response;
}

export async function deleteUser(request, userId, authToken) {
    const response = await request.delete(`https://dev0pz.com/api/user/${userId}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });
    if (response.status() !== 204) {
        throw new Error(`Delete user failed with status: ${response.status()}`);
    }
    console.log('User deleted successfully');
    return response;
}
