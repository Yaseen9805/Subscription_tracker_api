import { calculateMonthlySpendingSummary } from "../services/subscription.service.js";

const sub = (overrides = {}) => ({
    price: 10,
    currency: "USD",
    frequency: "monthly",
    category: "other",
    ...overrides,
});

describe("calculateMonthlySpendingSummary", () => {
    it("returns an empty array for no subscriptions", () => {
        expect(calculateMonthlySpendingSummary([])).toEqual([]);
    });

    it("converts each frequency to its monthly-equivalent cost", () => {
        const result = calculateMonthlySpendingSummary([
            sub({ price: 12, frequency: "daily" }), // 12 * 365/12 = 365
            sub({ price: 100, frequency: "weekly" }), // 100 * 52/12 = 433.33
            sub({ price: 15, frequency: "monthly" }), // 15
            sub({ price: 120, frequency: "yearly" }), // 120 / 12 = 10
        ]);

        expect(result).toHaveLength(1);
        expect(result[0].currency).toBe("USD");
        expect(result[0].activeCount).toBe(4);
        expect(result[0].monthlyTotal).toBeCloseTo(365 + 433.33 + 15 + 10, 2);
    });

    it("never adds different currencies together", () => {
        const result = calculateMonthlySpendingSummary([
            sub({ price: 10, currency: "USD" }),
            sub({ price: 20, currency: "INR" }),
            sub({ price: 5, currency: "USD" }),
        ]);

        const byCurrency = Object.fromEntries(result.map((r) => [r.currency, r]));
        expect(Object.keys(byCurrency).sort()).toEqual(["INR", "USD"]);
        expect(byCurrency.USD.monthlyTotal).toBe(15);
        expect(byCurrency.USD.activeCount).toBe(2);
        expect(byCurrency.INR.monthlyTotal).toBe(20);
        expect(byCurrency.INR.activeCount).toBe(1);
    });

    it("breaks down the total by category, rounded to 2 decimals", () => {
        const result = calculateMonthlySpendingSummary([
            sub({ price: 649, frequency: "monthly", category: "entertainment" }),
            sub({ price: 5999, frequency: "yearly", category: "technology" }), // 5999/12 = 499.9166...
        ]);

        expect(result).toHaveLength(1);
        expect(result[0].byCategory).toEqual({
            entertainment: 649,
            technology: 499.92,
        });
    });

    it("sums multiple subscriptions within the same category", () => {
        const result = calculateMonthlySpendingSummary([
            sub({ price: 10, category: "entertainment" }),
            sub({ price: 5, category: "entertainment" }),
            sub({ price: 7, category: "technology" }),
        ]);

        expect(result[0].byCategory).toEqual({
            entertainment: 15,
            technology: 7,
        });
    });
});
