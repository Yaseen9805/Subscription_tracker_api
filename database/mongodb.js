import dns from "node:dns";
import mongoose from "mongoose";
import { DB_URI, NODE_ENV } from "../config/env.js";
import logger from "../config/logger.js";

// On some Windows machines (commonly when VirtualBox/VPN virtual adapters are present
// alongside a real one), Node's DNS resolver fails to detect the OS nameserver and
// silently falls back to 127.0.0.1, breaking all lookups (not just the mongodb+srv
// SRV/TXT records this app needs). Pointing it at public resolvers sidesteps that.
// Scoped to win32 only: forcing public DNS unconditionally would break resolving
// Docker-internal hostnames (e.g. the "mongo" service name), which only resolve via
// Docker's embedded DNS server, not 8.8.8.8/1.1.1.1.
if (process.platform === "win32") {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

if (!DB_URI) {
    throw new Error("Please define the MONGODB_URI");
}

const connectToDatabase = async () => {
    try {
        await mongoose.connect(DB_URI);

        logger.info(`connected to database in ${NODE_ENV} mode`);
    } catch (error) {
        logger.error({ err: error }, "Failed to connect to database");

        process.exit(1);
    }
};

export default connectToDatabase;
