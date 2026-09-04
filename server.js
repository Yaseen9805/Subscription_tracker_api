import app from "./app.js";
import { PORT } from "./config/env.js";
import connectToDatabase from "./database/mongodb.js";
import logger from "./config/logger.js";

app.listen(PORT, async () => {
    logger.info(`Subscription Tracker API is running on http://localhost:${PORT}`);

    await connectToDatabase();
});
