import { request } from "./request.js";
import app from "../app.js";

let counter = 0;

export const registerUser = async (overrides = {}) => {
    counter += 1;
    const payload = {
        name: "Test User",
        email: `test-user-${Date.now()}-${counter}@example.com`,
        password: "password123",
        ...overrides,
    };

    const response = await request(app).post("/api/v1/auth/signup").send(payload);
    return { response, ...payload };
};
