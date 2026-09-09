import { createRequire } from "module";
import Subscription from "../models/subscription.model.js";
import dayjs from "dayjs";
import logger from "../config/logger.js";
import { sendRenewalReminderEmail } from "../services/email.service.js";

const require = createRequire(import.meta.url);
const { serve } = require("@upstash/workflow/express");

const REMINDERS = [7, 5, 2, 1];
export const sendReminders = serve(async (context) => {
    const { subscriptionId } = context.requestPayload;
    const subscription = await fetchSubscription(context, subscriptionId);

    if (!subscription || subscription.status !== "active") return;

    const renewaldate = dayjs(subscription.renewalDate);

    if (renewaldate.isBefore(dayjs())) {
        logger.info(
            `Renewal date has passed for subscription ${subscriptionId}. stopping workflow`
        );
        return;
    }
    for (const daysBefore of REMINDERS) {
        const reminderDate = renewaldate.subtract(daysBefore, "day");
        if (reminderDate.isAfter(dayjs())) {
            await sleepUntilReminder(context, `Reminder ${daysBefore} days before`, reminderDate);
        }
        await triggerReminder(
            context,
            `Reminder ${daysBefore} days before`,
            subscription,
            daysBefore
        );
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
