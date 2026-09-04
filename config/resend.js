import { Resend } from "resend";
import { RESEND_API_KEY } from "./env.js";

let client;

// Lazy + nullable on purpose: the Resend SDK throws at construction time if
// no key is given, which would otherwise crash the whole app on boot just
// because email reminders aren't configured yet.
export const getResendClient = () => {
    if (!RESEND_API_KEY) return null;
    if (!client) client = new Resend(RESEND_API_KEY);
    return client;
};
