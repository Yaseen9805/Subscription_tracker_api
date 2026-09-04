import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

let replSet;

beforeAll(async () => {
    // A replica set (even a 1-node one) is required because signup/deleteUser
    // use Mongoose transactions, which a plain standalone mongod doesn't support.
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(replSet.getUri());
}, 60000);

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const name in collections) {
        await collections[name].deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.disconnect();
    await replSet.stop();
}, 30000);
