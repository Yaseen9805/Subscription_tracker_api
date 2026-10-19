import dayjs from "dayjs";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";

const UNIT_BY_FREQUENCY = { daily: "day", weekly: "week", monthly: "month", yearly: "year" };

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
        ["daily", 45],
        ["weekly", 45],
        ["monthly", 45],
        ["yearly", 800],
    ])(
        "auto-calculates renewalDate as the first %s-period boundary that isn't before now",
        async (frequency, startDaysAgo) => {
            const startDate = daysAgo(startDaysAgo);
            const sub = build({ frequency, startDate, renewalDate: undefined });
            await sub.save();

            const unit = UNIT_BY_FREQUENCY[frequency];
            const renewal = dayjs(sub.renewalDate);
            const oneEarlier = renewal.subtract(1, unit);

            // "First boundary not before now": it itself must not be before now,
            // and the previous boundary must already have passed (otherwise it
            // overshot). Using fresh `now` snapshots keeps this immune to the few
            // ms between the hook running and this assertion.
            expect(renewal.isBefore(dayjs())).toBe(false);
            expect(oneEarlier.isBefore(dayjs())).toBe(true);
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
        const sub = build({
            startDate: daysAgo(40),
            renewalDate: daysAgo(10),
            status: "active",
        });
        await sub.save();

        expect(sub.status).toBe("expired");
    });

    it("stays active when renewalDate is in the future", async () => {
        const sub = build({ startDate: daysAgo(1), status: "active" });
        await sub.save();

        expect(sub.status).toBe("active");
    });

    it("stays active when started 40 days ago with no explicit renewalDate", async () => {
        const sub = build({ startDate: daysAgo(40), renewalDate: undefined, status: "active" });
        await sub.save();

        expect(sub.status).toBe("active");
        expect(dayjs(sub.renewalDate).isAfter(dayjs())).toBe(true);
    });

    it("does not clobber an explicitly cancelled status even if renewalDate has passed", async () => {
        const sub = build({ startDate: daysAgo(40), renewalDate: daysAgo(10) });
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
