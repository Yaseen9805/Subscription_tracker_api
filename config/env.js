import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });

export const {
    PORT,
    NODE_ENV,
    DB_URI,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    QSTASH_TOKEN,
    QSTASH_URL,
    SERVER_URL,
    RESEND_API_KEY,
    RESEND_FROM_EMAIL,
} = process.env;
