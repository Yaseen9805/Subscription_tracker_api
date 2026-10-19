import { request } from "./request.js";
import app from "../app.js";
import { registerUser } from "./helpers.js";

describe("Auth flows", () => {
    describe("POST /api/v1/auth/signup", () => {
        it("creates a user and returns a token", async () => {
            const { response, email } = await registerUser();

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toEqual(expect.any(String));
            expect(response.body.data.user.email).toBe(email);
        });

        it("rejects a duplicate email with 409", async () => {
            const { email } = await registerUser();

            const response = await request(app).post("/api/v1/auth/signup").send({
                name: "Another Name",
                email,
                password: "password123",
            });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
        });

        it("rejects an invalid payload with 400 and field details", async () => {
            const response = await request(app).post("/api/v1/auth/signup").send({
                name: "A",
                email: "not-an-email",
                password: "123",
            });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: "name" }),
                    expect.objectContaining({ field: "email" }),
                    expect.objectContaining({ field: "password" }),
                ])
            );
        });
    });

    describe("POST /api/v1/auth/signin", () => {
        it("logs in with correct credentials", async () => {
            const { email, password } = await registerUser();

            const response = await request(app)
                .post("/api/v1/auth/signin")
                .send({ email, password });

            expect(response.status).toBe(200);
            expect(response.body.data.token).toEqual(expect.any(String));
        });

        it("rejects a wrong password with 401", async () => {
            const { email } = await registerUser();

            const response = await request(app).post("/api/v1/auth/signin").send({
                email,
                password: "wrong-password",
            });

            expect(response.status).toBe(401);
        });

        it("rejects a nonexistent email with 401", async () => {
            const response = await request(app).post("/api/v1/auth/signin").send({
                email: "nobody@example.com",
                password: "password123",
            });

            expect(response.status).toBe(401);
        });
    });

    describe("POST /api/v1/auth/signout", () => {
        it("clears the cookie and returns success", async () => {
            const response = await request(app).post("/api/v1/auth/signout");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
