
import { faker } from "./helpers/faker";

export const API_ENDPOINT = {
    getHealth: '/health', // GET Health check
    createUser: '/user', // POST Create user
    login: '/auth/login', // POST Login
    logout: '/auth/logout', // POST Logout
    sendRequest: '/requests', // POST Request to create a new request
    getRequest: '/status/:id', // GET Request status by ID
    getSession: '/auth/me', // GET Session info
    getRequestsList: '/requests', // GET Requests list
    getRequestById: (id: string) => `/requests/${id}`, // GET Request by ID
    createRequest: '/requests', // POST to create a new request
    updateRequest: (id: string) => `/requests/${id}`, // PATCH to update a request
    deleteRequest: (id: string) => `/requests/${id}`, // DELETE to delete a request
};

export const CREDS = {
    admin: {
        email: "admin@test.com",
        password: "123456qQ!"
    },
    user: {
        email: faker.internet.email(),
        password: "123456Qq!"
    }
};

export const REQUEST_SUBMISSION = {
    inputs: {
        // --- dynamic: re-generated on every test run ---
        standard:     { name: faker.person.fullName(),                                    description: faker.lorem.sentence() },
        generic:      { name: faker.person.fullName(),                                    description: faker.lorem.sentence() },
        janeSmith:    { name: faker.person.fullName() },
        mobileApp:    { description: faker.lorem.sentence() },
        whitespace:   { name: `   ${faker.person.fullName()}   `,                         description: `   ${faker.lorem.sentence()}   ` },
        longName: {
            name: [...Array(8)].map(() => faker.person.fullName()).join(" "),
            description: faker.lorem.sentence(),
        },
        longDesc: {
            name: faker.person.fullName(),
            description: faker.lorem.paragraphs(20),
        },
        tabNav:       { name: faker.person.firstName(),                                   description: faker.lorem.words(3) },
        payloadCheck: { name: faker.person.fullName(),                                    description: faker.lorem.sentence() },
        apiEndpoint:  { name: faker.person.fullName(),                                    description: faker.lorem.sentence() },
        simpleSubmit: { name: faker.person.fullName(),                                    description: faker.lorem.sentence() },
        refresh:      { name: faker.person.fullName(),                                    description: faker.lorem.sentence() },
        sensitive:    { name: faker.person.fullName(),                                    description: faker.lorem.sentence() },
        keyboard:     { name: faker.person.firstName(),                                   description: faker.lorem.word() },
        endToEnd:     { name: faker.person.fullName(),                                    description: faker.lorem.sentence() },
        numbers:      { name: `${faker.person.firstName()} 007`,                          description: faker.lorem.sentence() },
        // --- static: fixed payloads required for security/boundary tests ---
        minimal:      { name: "A",                                  description: "B" },
        specialChars: { name: "Jos\u00e9 Mar\u00eda Garc\u00eda-L\u00f3pez O'Brien",  description: "Web development",  nameFragment: "Jos\u00e9" },
        xss:          { name: "<script>alert('xss')</script> John", description: "<img src=x onerror=alert('xss')>" },
        sqlInjection: { name: "' OR '1'='1",                        description: "test'; DROP TABLE orders; --", nameFragment: "'" },
    },
    messages: {
        errorDialog: "Failed to submit order. Please try again.",
    },
    apiResponses: {
        success:                 { success: true },
        successWithOrderId12345: { success: true, orderId: "12345" },
        successWithOrderId123:   { success: true, orderId: "123" },
        badRequest:              { error: "Bad request" },
        invalidRequest:          { error: "Invalid request" },
    },
};