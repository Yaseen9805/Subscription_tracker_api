import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";

const daysAgo = (n) => {
    const date = new Date();
    date.setDate(date.getDate() - n);
    return date;
};

const daysFromNow = (n) => daysAgo(-n);

describe("Subscription renewal-date calculation", () => {
    let userId;

    beforeEach(async () => {
        const user = await User.create({
            name: "Renewal Test",
            email: `renewal-${Date.now()}@example.com`,
            password: "hashed-password-not-real",
        });
        userId = user._id;
    });

    const build = (overrides = {}) =>
        new Subscription({
            name: "Test Sub",
            price: 10,
            frequency: "monthly",
            category: "other",
            paymentMethod: "card",
            startDate: daysAgo(5),
            user: userId,
            ...overrides,
        });

    it.each([
        ["daily", 1],
        ["weekly", 7],
        ["monthly", 30],
        ["yearly", 365],
    ])(
        "auto-calculates renewalDate as startDate + %s period when not provided",
        async (frequency, days) => {
            const startDate = daysAgo(2);
            const sub = build({ frequency, startDate, renewalDate: undefined });
            await sub.save();

            const expected = new Date(startDate);
            expected.setDate(expected.getDate() + days);

            expect(sub.renewalDate.toDateString()).toBe(expected.toDateString());
        }
    );

    it("does not override an explicitly provided renewalDate", async () => {
        const startDate = daysAgo(5);
        const explicitRenewal = daysFromNow(20);
        const sub = build({ startDate, renewalDate: explicitRenewal });
        await sub.save();

        expect(sub.renewalDate.toDateString()).toBe(explicitRenewal.toDateString());
    });

    it("flips status to expired when renewalDate has passed and status was active", async () => {
        const sub = build({ startDate: daysAgo(40), status: "active" });
        await sub.save();

        expect(sub.status).toBe("expired");
    });

    it("stays active when renewalDate is in the future", async () => {
        const sub = build({ startDate: daysAgo(1), status: "active" });
        await sub.save();

        expect(sub.status).toBe("active");
    });

    it("does not clobber an explicitly cancelled status even if renewalDate has passed", async () => {
        const sub = build({ startDate: daysAgo(40) });
        await sub.save();
        expect(sub.status).toBe("expired");

        sub.status = "cancelled";
        await sub.save();

        expect(sub.status).toBe("cancelled");
    });

    it("rejects a renewalDate that is not after startDate", async () => {
        const startDate = daysAgo(5);
        const sub = build({ startDate, renewalDate: daysAgo(10) });

        await expect(sub.save()).rejects.toThrow();
    });

    it("rejects a startDate in the future", async () => {
        const sub = build({ startDate: daysFromNow(5) });

        await expect(sub.save()).rejects.toThrow();
    });
});
