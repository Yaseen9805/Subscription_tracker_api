import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.js";
import { withoutPassword } from "../utils/sanitize.js";

export const signupUser = async ({ name, email, password }) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const existinguser = await User.findOne({ email });

        if (existinguser) {
            const error = new Error("already exists");
            error.statusCode = 409;
            throw error;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedpassword = await bcrypt.hash(password, salt);

        const newuser = await User.create([{ name, email, password: hashedpassword }], { session });

        const token = jwt.sign({ userId: newuser[0]._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        await session.commitTransaction();
        session.endSession();

        return { token, user: withoutPassword(newuser[0]) };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

export const signinUser = async ({ email, password }) => {
    const user = await User.findOne({ email });

    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    const ispasswordvalid = await bcrypt.compare(password, user.password);
    if (!ispasswordvalid) {
        const error = new Error("invalid password");
        error.statusCode = 401;
        throw error;
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return { token, user: withoutPassword(user) };
};
