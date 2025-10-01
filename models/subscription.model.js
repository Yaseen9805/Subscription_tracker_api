import mongoose from "mongoose";

const subcriptionschema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'subscription name is required'],
        trim: true,
        minLength: 2,
        maxLength: 100,
    },
    price: {
        type: Number,
        required: [true, 'subscription price is required'],
        min: [0, 'Price must be greater than 0'],
    },
    currency: {
        type: String,
        enum: ['USD', 'EUR', 'GBP'],
        default: 'USD'
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    category: {
        type: String,
        enum: ['sports', 'news', 'entertainment', 'lifestyle', 'technology', 'finance', 'politics', 'other'],
        required: true,
    },
    paymentMethod: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired'],
        default: 'active'
    },
    startDate: {
        type: Date,
        required: true,
        validate: {
            validator: (value) => value <= new Date(),
            message: 'start date must be in the past',
        }
    },
    renewalDate: {
        type: Date,
        validate: {
            validator: function (value) {
                return value > this.startDate;
            },
            message: 'renewal date must be after the start date',
        }
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true,
    },
    workflowId: {
        type: String,
        trim: true,
        index: true
    }
}, { timestamps: true });

subcriptionschema.pre('save', function (next) {
    if (!this.renewaldate) {
        const renewalperiods = {
            daily: 1,
            weekly: 7,
            monthly: 30,
            yearly: 365,
        };
        this.renewaldate = new Date(this.startDate);
        this.renewaldate.setDate(this.renewaldate.getDate() + renewalperiods[this.frequency]);
    }
    if (this.renewaldate < new Date()) {
        this.status = 'expired';
    }
    next();
});

const subscription = mongoose.model('subscription', subcriptionschema)
export default subscription;