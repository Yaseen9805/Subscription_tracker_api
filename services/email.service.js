import { getResendClient } from "../config/resend.js";
import { RESEND_FROM_EMAIL } from "../config/env.js";
import logger from "../config/logger.js";

// Resend's free tier requires no setup at all when sending from this shared
// sandbox address, but it will only actually deliver to the email the
// Resend account itself was signed up with -- sending to arbitrary
// recipients needs a verified domain (see README). RESEND_FROM_EMAIL lets
// that be swapped in without touching this file.
const DEFAULT_FROM = "Subscription Tracker <onboarding@resend.dev>";

export const sendRenewalReminderEmail = async ({ to, name, subscriptionName, price, currency, renewalDate, daysBefore }) => {
    const dayWord = daysBefore === 1 ? "day" : "days";

    const resend = getResendClient();
    if (!resend) {
        logger.warn({ to }, "RESEND_API_KEY not set -- skipping renewal reminder email");
        return { success: false, error: "RESEND_API_KEY not configured" };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: RESEND_FROM_EMAIL || DEFAULT_FROM,
            to,
            subject: `Reminder: ${subscriptionName} renews in ${daysBefore} ${dayWord}`,
            html: `
                <p>Hi ${name},</p>
                <p>Your <strong>${subscriptionName}</strong> subscription (${price} ${currency}) renews on
                <strong>${renewalDate}</strong> — that's in ${daysBefore} ${dayWord}.</p>
            `,
        });

        if (error) {
            logger.error({ err: error, to }, "Resend rejected the renewal reminder email");
            return { success: false, error };
        }

        logger.info({ emailId: data?.id, to }, "Renewal reminder email sent");
        return { success: true, data };
    } catch (error) {
        logger.error({ err: error, to }, "Failed to send renewal reminder email");
        return { success: false, error };
    }
};
