import dayjs from "dayjs";
import { getUpcomingReminders } from "../utils/reminders.js";

describe("getUpcomingReminders", () => {
    const now = dayjs();

    it("returns only reminders still ahead of a renewal 3 days away", () => {
        const renewalDate = now.add(3, "day");
        expect(getUpcomingReminders(renewalDate, now)).toEqual([2, 1]);
    });

    it("returns all reminders for a renewal 10 days away", () => {
        const renewalDate = now.add(10, "day");
        expect(getUpcomingReminders(renewalDate, now)).toEqual([7, 5, 2, 1]);
    });

    it("returns no reminders for a renewal date already in the past", () => {
        const renewalDate = now.subtract(1, "day");
        expect(getUpcomingReminders(renewalDate, now)).toEqual([]);
    });
});
