import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import authrouter from "./routes/auth.routes.js";
import Subscriptionrouter from "./routes/subscription.routes.js";
import userrouter from "./routes/users.routes.js";
import errormiddleware from "./middlewares/error.middleware.js";
import cookieParser from "cookie-parser";
import { generalLimiter, authLimiter, botCheck } from "./middlewares/security.middlewares.js";
import workflowrouter from "./routes/workflow.routes.js";
import logger from "./config/logger.js";
import openapiSpec from "./docs/openapi.js";

const app = express();

app.get("/health", (req, res) => {
    const dbStatusByReadyState = ["disconnected", "connected", "connecting", "disconnecting"];

    res.status(200).json({
        success: true,
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatusByReadyState[mongoose.connection.readyState] || "unknown",
    });
});

app.use("/api-docs", helmet(), swaggerUi.serve, swaggerUi.setup(openapiSpec));

// /health and /api-docs are registered above, before this logger and every
// other middleware, so infra health probes and docs browsing never generate
// a log line or run through rate limiting / bot-checking.
app.use(helmet());
app.use(pinoHttp({ logger }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());
app.use(botCheck);
app.use(generalLimiter);

app.use('/api/v1/auth', authLimiter, authrouter);
app.use('/api/v1/subscriptions', Subscriptionrouter);
app.use('/api/v1/users', userrouter);
app.use('/api/v1/workflows', workflowrouter);

app.get("/", (req, res) => {
    res.send("Welcome to the Subscription Tracker API");
});

app.use(errormiddleware);

export default app;
