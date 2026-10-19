import { request } from "./request.js";
import app from "../app.js";
import { registerUser } from "./helpers.js";

// Dates are computed relative to "now" (not hardcoded) so this suite keeps
// passing regardless of what real-world date it's run on.
const daysAgo = (n) => {
    const date = new Date();
    date.setDate(date.getDate() - n);
    return date.toISOString().slice(0, 10);
};

const validSubscription = {
    name: "Netflix",
    price: 15.99,
    currency: "USD",
    frequency: "monthly",
    category: "entertainment",
    paymentMethod: "card",
    startDate: daysAgo(40),
    renewalDate: daysAgo(10), // explicit past date -> status becomes "expired"
};

describe("Subscription CRUD", () => {
    let token;
    let userId;

    beforeEach(async () => {
        const { response } = await registerUser();
        token = response.body.data.token;
        userId = response.body.data.user._id;
    });

    const authed = (req) => req.set("Authorization", `Bearer ${token}`);

    it("creates a subscription for the authenticated user", async () => {
        const response = await authed(request(app).post("/api/v1/subscriptions")).send(
            validSubscription
        );

        expect(response.status).toBe(201);
        expect(response.body.data.name).toBe("Netflix");
        expect(response.body.data.user).toBe(userId);
    });

    it("creates a monthly subscription started 40 days ago as active, with a future renewal date", async () => {
        const response = await authed(request(app).post("/api/v1/subscriptions")).send({
            ...validSubscription,
            renewalDate: undefined,
        });

        expect(response.status).toBe(201);
        expect(response.body.data.status).toBe("active");
        expect(new Date(response.body.data.renewalDate).getTime()).toBeGreaterThan(Date.now());
    });

    it("rejects an invalid subscription payload with 400", async () => {
        const response = await authed(request(app).post("/api/v1/subscriptions")).send({
            name: "Netflix",
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it("rejects subscription creation with no auth token", async () => {
        const response = await request(app).post("/api/v1/subscriptions").send(validSubscription);
        expect(response.status).toBe(401);
    });

    it("lists only the authenticated user's subscriptions", async () => {
        await authed(request(app).post("/api/v1/subscriptions")).send(validSubscription);

        const { response: otherSignup } = await registerUser();
        const otherToken = otherSignup.body.data.token;
        await request(app)
            .post("/api/v1/subscriptions")
            .set("Authorization", `Bearer ${otherToken}`)
            .send(validSubscription);

        const response = await authed(request(app).get("/api/v1/subscriptions"));

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].user).toBe(userId);
    });

    it("gets a single subscription by id", async () => {
        const created = await authed(request(app).post("/api/v1/subscriptions")).send(
            validSubscription
        );
        const id = created.body.data._id;

        const response = await authed(request(app).get(`/api/v1/subscriptions/${id}`));

        expect(response.status).toBe(200);
        expect(response.body.data._id).toBe(id);
    });

    it("returns 403 when fetching another user's subscription", async () => {
        const created = await authed(request(app).post("/api/v1/subscriptions")).send(
            validSubscription
        );
        const id = created.body.data._id;

        const { response: otherSignup } = await registerUser();
        const otherToken = otherSignup.body.data.token;

        const response = await request(app)
            .get(`/api/v1/subscriptions/${id}`)
            .set("Authorization", `Bearer ${otherToken}`);

        expect(response.status).toBe(403);
    });

    it("returns 404 for a nonexistent subscription id", async () => {
        const response = await authed(
            request(app).get("/api/v1/subscriptions/000000000000000000000000")
        );
        expect(response.status).toBe(404);
    });

    it("updates a subscription's fields", async () => {
        const created = await authed(request(app).post("/api/v1/subscriptions")).send(
            validSubscription
        );
        const id = created.body.data._id;

        const response = await authed(request(app).put(`/api/v1/subscriptions/${id}`)).send({
            price: 19.99,
        });

        expect(response.status).toBe(200);
        expect(response.body.data.price).toBe(19.99);
    });

    it("rejects an empty update body with 400", async () => {
        const created = await authed(request(app).post("/api/v1/subscriptions")).send(
            validSubscription
        );
        const id = created.body.data._id;

        const response = await authed(request(app).put(`/api/v1/subscriptions/${id}`)).send({});
        expect(response.status).toBe(400);
    });

    it("cancels a subscription, even one whose renewal date has already passed", async () => {
        const created = await authed(request(app).post("/api/v1/subscriptions")).send(
            validSubscription
        );
        const id = created.body.data._id;
        // validSubscription has an explicit past renewalDate, so the pre-save
        // hook auto-expires it on creation -- this is a regression test for that
        // hook previously clobbering an explicit cancel back to "expired".
        expect(created.body.data.status).toBe("expired");

        const response = await authed(request(app).put(`/api/v1/subscriptions/${id}/cancel`));

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe("cancelled");
    });

    it("deletes a subscription", async () => {
        const created = await authed(request(app).post("/api/v1/subscriptions")).send(
            validSubscription
        );
        const id = created.body.data._id;

        const deleteResponse = await authed(request(app).delete(`/api/v1/subscriptions/${id}`));
        expect(deleteResponse.status).toBe(200);

        const getResponse = await authed(request(app).get(`/api/v1/subscriptions/${id}`));
        expect(getResponse.status).toBe(404);
    });

    it("only returns active subscriptions renewing within the given window", async () => {
        await authed(request(app).post("/api/v1/subscriptions")).send(validSubscription); // already expired

        const upcoming = {
            ...validSubscription,
            name: "Spotify",
            startDate: daysAgo(0),
            renewalDate: undefined,
        };
        await authed(request(app).post("/api/v1/subscriptions")).send(upcoming);

        const response = await authed(
            request(app).get("/api/v1/subscriptions/upcoming-renewals?days=60")
        );

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].name).toBe("Spotify");
    });
});

describe("GET /api/v1/subscriptions/summary", () => {
    let token;

    beforeEach(async () => {
        const { response } = await registerUser();
        token = response.body.data.token;
    });

    const authed = (req) => req.set("Authorization", `Bearer ${token}`);

    // No explicit renewalDate and startDate of today -> rolls forward to an
    // active renewal date, unlike validSubscription above.
    const activeSub = (overrides = {}) => ({
        name: "Sub",
        price: 10,
        currency: "USD",
        frequency: "monthly",
        category: "entertainment",
        paymentMethod: "card",
        startDate: daysAgo(0),
        ...overrides,
    });

    it("returns an empty list when the user has no subscriptions", async () => {
        const response = await authed(request(app).get("/api/v1/subscriptions/summary"));

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
    });

    it("converts mixed frequencies to a monthly-equivalent total", async () => {
        await authed(request(app).post("/api/v1/subscriptions")).send(
            activeSub({ name: "Monthly", price: 10, frequency: "monthly" })
        );
        await authed(request(app).post("/api/v1/subscriptions")).send(
            activeSub({ name: "Yearly", price: 120, frequency: "yearly" }) // 120/12 = 10
        );

        const response = await authed(request(app).get("/api/v1/subscriptions/summary"));

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([
            {
                currency: "USD",
                monthlyTotal: 20,
                activeCount: 2,
                byCategory: { entertainment: 20 },
            },
        ]);
    });

    it("keeps mixed currencies as separate totals", async () => {
        await authed(request(app).post("/api/v1/subscriptions")).send(
            activeSub({ name: "USD sub", price: 10, currency: "USD" })
        );
        await authed(request(app).post("/api/v1/subscriptions")).send(
            activeSub({ name: "INR sub", price: 500, currency: "INR" })
        );

        const response = await authed(request(app).get("/api/v1/subscriptions/summary"));

        expect(response.status).toBe(200);
        const byCurrency = Object.fromEntries(response.body.data.map((row) => [row.currency, row]));
        expect(Object.keys(byCurrency).sort()).toEqual(["INR", "USD"]);
        expect(byCurrency.USD.monthlyTotal).toBe(10);
        expect(byCurrency.INR.monthlyTotal).toBe(500);
    });

    it("excludes cancelled subscriptions", async () => {
        const cancelled = await authed(request(app).post("/api/v1/subscriptions")).send(
            activeSub({ name: "Cancel me", price: 50 })
        );
        await authed(request(app).put(`/api/v1/subscriptions/${cancelled.body.data._id}/cancel`));

        await authed(request(app).post("/api/v1/subscriptions")).send(
            activeSub({ name: "Keep me", price: 10 })
        );

        const response = await authed(request(app).get("/api/v1/subscriptions/summary"));

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].monthlyTotal).toBe(10);
        expect(response.body.data[0].activeCount).toBe(1);
    });

    it("excludes another user's subscriptions", async () => {
        const { response: otherSignup } = await registerUser();
        const otherToken = otherSignup.body.data.token;
        await request(app)
            .post("/api/v1/subscriptions")
            .set("Authorization", `Bearer ${otherToken}`)
            .send(activeSub({ name: "Someone else's sub", price: 999 }));

        const response = await authed(request(app).get("/api/v1/subscriptions/summary"));

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
    });
});
