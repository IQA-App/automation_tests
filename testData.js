export const URL_ENDPOINT = {
    getHealth: '/health', // GET Health check
    login: '/api/auth/login', // POST Login
    logout: '/api/auth/logout', // POST Logout
    sendRequest: '/api/requests', // POST Request to create a new request
    getRequest: '/api/status/:id', // GET Request status by ID
    getSession: '/api/auth/me', // GET Session info
    getRequestsList: '/api/requests', // GET Requests list
    getRequestById: (id) => `/api/requests/${id}`, // GET Request by ID
    createRequest: '/api/requests', // POST to create a new request
    updateRequest: (id) => `/api/requests/${id}`, // PATCH to update a request
    deleteRequest: (id) => `/api/requests/${id}`, // DELETE to delete a request
    sendRequest: '/api/requests', // POST Request to create a new request
};