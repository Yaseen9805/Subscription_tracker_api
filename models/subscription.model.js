import mongoose from "mongoose";
import dayjs from "dayjs";

const subscriptionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "subscription name is required"],
            trim: true,
            minLength: 2,
            maxLength: 100,
        },
        price: {
            type: Number,
            required: [true, "subscription price is required"],
            min: [0, "Price cannot be negative"],
        },
        currency: {
            type: String,
            enum: ["USD", "EUR", "GBP", "INR"],
            default: "USD",
        },
        frequency: {
            type: String,
            enum: ["daily", "weekly", "monthly", "yearly"],
            required: true,
        },
        category: {
            type: String,
            enum: [
                "sports",
                "news",
                "entertainment",
                "lifestyle",
                "technology",
                "finance",
                "politics",
                "other",
            ],
            required: true,
        },
        paymentMethod: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["active", "cancelled", "expired"],
            default: "active",
        },
        startDate: {
            type: Date,
            required: true,
            validate: {
                validator: (value) => value <= new Date(),
                message: "start date must be in the past",
            },
        },
        renewalDate: {
            type: Date,
            validate: {
                validator: function (value) {
                    return value > this.startDate;
                },
                message: "renewal date must be after the start date",
            },
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
            index: true,
        },
        workflowId: {
            type: String,
            trim: true,
            index: true,
        },
    },
    { timestamps: true }
);

subscriptionSchema.pre("save", function (next) {
    if (!this.renewalDate) {
        const unit = { daily: "day", weekly: "week", monthly: "month", yearly: "year" }[
            this.frequency
        ];
        const now = dayjs();
        let periods = 1;
        let renewal = dayjs(this.startDate).add(periods, unit);
        while (renewal.isBefore(now)) {
            periods += 1;
            // Always add from startDate, so a Jan 31 start stays month-end
            renewal = dayjs(this.startDate).add(periods, unit);
        }
        this.renewalDate = renewal.toDate();
    }
    if (this.status === "active" && this.renewalDate < new Date()) {
        this.status = "expired";
    }
    next();
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
