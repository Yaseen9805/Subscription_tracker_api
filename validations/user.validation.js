import { z } from "zod";

export const createUserSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
    email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export const updateUserSchema = z
    .object({
        name: z.string().trim().min(2, "Name must be at least 2 characters").max(50).optional(),
        email: z
            .string()
            .trim()
            .toLowerCase()
            .email("Please provide a valid email address")
            .optional(),
        password: z.string().min(6, "Password must be at least 6 characters").max(100).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });
