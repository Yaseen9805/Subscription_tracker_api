import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Subscription from "../models/subscription.model.js";
import { withoutPassword } from "../utils/sanitize.js";

const notFound = () => {
    const error = new Error("User not found");
    error.statusCode = 404;
    return error;
};

export const updateUser = async (targetId, requestingUserId, updates) => {
    if (targetId !== requestingUserId.toString()) {
        const error = new Error("You are not authorized to update this account");
        error.statusCode = 403;
        throw error;
    }

    const user = await User.findById(targetId);
    if (!user) throw notFound();

    const { name, email, password } = updates;
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (password !== undefined) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    return withoutPassword(user);
};

export const deleteUser = async (targetId, requestingUserId) => {
    if (targetId !== requestingUserId.toString()) {
        const error = new Error("You are not authorized to delete this account");
        error.statusCode = 403;
        throw error;
    }

    const session = await mongoose.startSession();
    try {
        // withTransaction (not manual commit/abort) retries transient errors itself
        // and never aborts a transaction that already committed.
        await session.withTransaction(async () => {
            const user = await User.findById(targetId).session(session);
            if (!user) throw notFound();

            await Subscription.deleteMany({ user: user._id }).session(session);
            await user.deleteOne({ session });
        });
    } finally {
        await session.endSession();
    }
};
