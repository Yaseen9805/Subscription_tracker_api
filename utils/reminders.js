import dayjs from "dayjs";

const REMINDER_DAYS = [7, 5, 2, 1];

// Reminders still in the future at `now`. Past ones are skipped, never sent late.
export const getUpcomingReminders = (renewalDate, now) =>
    REMINDER_DAYS.filter(
        (daysBefore) => !dayjs(renewalDate).subtract(daysBefore, "day").isBefore(now)
    );
