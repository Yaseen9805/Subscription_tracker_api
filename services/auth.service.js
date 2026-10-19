import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.js";
import { withoutPassword } from "../utils/sanitize.js";

export const signupUser = async ({ name, email, password }) => {
    const session = await mongoose.startSession();
    let newUser;
    try {
        // withTransaction (not manual commit/abort) retries transient errors itself
        // and never aborts a transaction that already committed.
        await session.withTransaction(async () => {
            const existingUser = await User.findOne({ email });

            if (existingUser) {
                const error = new Error("already exists");
                error.statusCode = 409;
                throw error;
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            newUser = await User.create([{ name, email, password: hashedPassword }], { session });
        });
    } finally {
        await session.endSession();
    }

    const token = jwt.sign({ userId: newUser[0]._id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });

    return { token, user: withoutPassword(newUser[0]) };
};

export const signinUser = async ({ email, password }) => {
    const user = await User.findOne({ email });

    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        const error = new Error("invalid password");
        error.statusCode = 401;
        throw error;
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return { token, user: withoutPassword(user) };
};
