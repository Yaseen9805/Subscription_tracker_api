import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.js";
import { withoutPassword } from "../utils/sanitize.js";
import { runInTransaction } from "../utils/transaction.js";

export const signupUser = async ({ name, email, password }) => {
    // Hashed up front so the CPU-bound work neither holds the transaction open nor
    // repeats if withTransaction retries the callback.
    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

    const newUser = await runInTransaction(async (session) => {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            const error = new Error("already exists");
            error.statusCode = 409;
            throw error;
        }

        return User.create([{ name, email, password: hashedPassword }], { session });
    });

    const token = jwt.sign({ userId: newUser[0]._id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });

    return { token, user: withoutPassword(newUser[0]) };
};

export const signinUser = async ({ email, password }) => {
    const user = await User.findOne({ email });

    if (!user) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return { token, user: withoutPassword(user) };
};
