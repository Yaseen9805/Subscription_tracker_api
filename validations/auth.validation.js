import { z } from "zod";

export const signupSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
    email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export const signinSchema = z.object({
    email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
    password: z.string().min(1, "Password is required"),
});
