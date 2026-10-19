import { z } from "zod";

const CURRENCIES = ["USD", "EUR", "GBP", "INR"];
const FREQUENCIES = ["daily", "weekly", "monthly", "yearly"];
const CATEGORIES = [
    "sports",
    "news",
    "entertainment",
    "lifestyle",
    "technology",
    "finance",
    "politics",
    "other",
];
const STATUSES = ["active", "cancelled", "expired"];

export const createSubscriptionSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    price: z.number().min(0, "Price cannot be negative"),
    currency: z.enum(CURRENCIES).optional(),
    frequency: z.enum(FREQUENCIES, {
        message: `Frequency must be one of: ${FREQUENCIES.join(", ")}`,
    }),
    category: z.enum(CATEGORIES, { message: `Category must be one of: ${CATEGORIES.join(", ")}` }),
    paymentMethod: z.string().trim().min(1, "Payment method is required"),
    startDate: z.coerce.date({ message: "startDate must be a valid date" }),
    renewalDate: z.coerce.date().optional(),
    forceWorkflow: z.boolean().optional(),
});

export const updateSubscriptionSchema = z
    .object({
        name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
        price: z.number().min(0, "Price cannot be negative").optional(),
        currency: z.enum(CURRENCIES).optional(),
        frequency: z.enum(FREQUENCIES).optional(),
        category: z.enum(CATEGORIES).optional(),
        paymentMethod: z.string().trim().min(1).optional(),
        status: z.enum(STATUSES).optional(),
        startDate: z.coerce.date().optional(),
        renewalDate: z.coerce.date().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });
