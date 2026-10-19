import { createRequire } from "module";
import Subscription from "../models/subscription.model.js";
import dayjs from "dayjs";
import logger from "../config/logger.js";
import { sendRenewalReminderEmail } from "../services/email.service.js";
import { getUpcomingReminders } from "../utils/reminders.js";

const require = createRequire(import.meta.url);
const { serve } = require("@upstash/workflow/express");

export const sendReminders = serve(async (context) => {
    const { subscriptionId } = context.requestPayload;
    const subscription = await fetchSubscription(context, subscriptionId);
    if (!subscription || subscription.status !== "active") return;

    // Upstash re-runs this function from the top after every step, so anything
    // time-based must be captured once inside a step to keep replays identical.
    const startedAt = await context.run("get start time", async () => Date.now());
    const renewalDate = dayjs(subscription.renewalDate);

    for (const daysBefore of getUpcomingReminders(renewalDate, startedAt)) {
        const reminderDate = renewalDate.subtract(daysBefore, "day");
        await sleepUntilReminder(context, `wait ${daysBefore}d before`, reminderDate);

        // Stop if the user cancelled or deleted the subscription while we slept
        const stillActive = await context.run(`check status ${daysBefore}d before`, async () => {
            const latest = await Subscription.findById(subscriptionId).select("status");
            return latest?.status === "active";
        });
        if (!stillActive) return;

        await triggerReminder(context, `send ${daysBefore}d before`, subscription, daysBefore);
    }
});

const fetchSubscription = async (context, subscriptionId) => {
    return await context.run("get subscription", async () => {
        return Subscription.findById(subscriptionId).populate("user", "name email");
    });
};
const sleepUntilReminder = async (context, label, date) => {
    logger.info(`sleeping until ${label} reminder at ${date}`);
    await context.sleepUntil(label, date.toDate());
};
const triggerReminder = async (context, label, subscription, daysBefore) => {
    return await context.run(label, async () => {
        logger.info(`Triggering ${label} reminder`);
        await sendRenewalReminderEmail({
            to: subscription.user.email,
            name: subscription.user.name,
            subscriptionName: subscription.name,
            price: subscription.price,
            currency: subscription.currency,
            renewalDate: dayjs(subscription.renewalDate).format("MMMM D, YYYY"),
            daysBefore,
        });
    });
};
export default sendReminders;
