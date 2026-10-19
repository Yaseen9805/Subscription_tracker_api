import { request } from "./request.js";
import app from "../app.js";

describe("App-level behavior", () => {
    it("returns a JSON 404 for an unknown route", async () => {
        const response = await request(app).get("/this-route-does-not-exist");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ success: false, error: "Route not found" });
    });

    it("returns a consistent { success, error } shape on 401", async () => {
        const response = await request(app).get("/api/v1/users/me");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ success: false, error: "Unauthorized" });
    });

    it("reports a healthy database connection", async () => {
        const response = await request(app).get("/health");

        expect(response.status).toBe(200);
        expect(response.body.database).toBe("connected");
    });
});
