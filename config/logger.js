import pino from "pino";
import { NODE_ENV } from "./env.js";

const env = (NODE_ENV || "development").toLowerCase();
const isProduction = env === "production";
const isTest = env === "test";

const level = isTest ? "silent" : (process.env.LOG_LEVEL || (isProduction ? "info" : "debug"));

const logger = pino({
    level,
    transport: !isProduction && !isTest
        ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard", ignore: "pid,hostname" } }
        : undefined,
});

export default logger;
