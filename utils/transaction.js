import mongoose from "mongoose";

// withTransaction (not manual commit/abort) retries transient errors itself
// and never aborts a transaction that already committed.
export const runInTransaction = async (work) => {
    const session = await mongoose.startSession();
    try {
        return await session.withTransaction(() => work(session));
    } finally {
        await session.endSession();
    }
};
