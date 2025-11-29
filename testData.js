

export const API_ENDPOINT = {
    getHealth: '/health', // GET Health check
    createUser: '/user', // POST Create user
    login: '/auth/login', // POST Login
    logout: '/auth/logout', // POST Logout
    sendRequest: '/requests', // POST Request to create a new request
    getRequest: '/status/:id', // GET Request status by ID
    getSession: '/auth/me', // GET Session info
    getRequestsList: '/requests', // GET Requests list
    getRequestById: (id) => `/requests/${id}`, // GET Request by ID
    createRequest: '/requests', // POST to create a new request
    updateRequest: (id) => `/requests/${id}`, // PATCH to update a request
    deleteRequest: (id) => `/requests/${id}`, // DELETE to delete a request
    sendRequest: '/requests', // POST Request to create a new request
};

const randNum = () => Math.floor(Math.random() * 900000) + 100000; // 6-digit random
const makeEmail = (prefix = 'userU') => `${prefix}${randNum()}@example.com`;

export const CREDS = {
    admin: {
        email: "admin@test.com",
        password: "123456qQ!"
    },
    user: {
        email: `test${randNum()}@example.com`, 
        password: "123456Qq!"
    }
};