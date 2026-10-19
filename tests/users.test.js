import { request } from "./request.js";
import app from "../app.js";
import { registerUser } from "./helpers.js";

describe("GET /api/v1/users/me", () => {
    it("returns the caller's own user without a password", async () => {
        const { response: signup, name, email } = await registerUser();
        const token = signup.body.data.token;

        const response = await request(app)
            .get("/api/v1/users/me")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.name).toBe(name);
        expect(response.body.data.email).toBe(email);
        expect(response.body.data.password).toBeUndefined();
    });

    it("returns 401 without a token", async () => {
        const response = await request(app).get("/api/v1/users/me");
        expect(response.status).toBe(401);
    });
});

describe("GET /api/v1/users", () => {
    it("no longer exists -- the user-listing route was removed", async () => {
        const { response: signup } = await registerUser();
        const token = signup.body.data.token;

        const response = await request(app)
            .get("/api/v1/users")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(404);
    });
});
