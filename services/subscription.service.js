import subscription from "../models/subscription.model.js";
import { workflowClient } from "../config/upstash.js";
import { SERVER_URL, NODE_ENV } from "../config/env.js";

const notFound = (message = "Subscription not found") => {
    const error = new Error(message);
    error.statusCode = 404;
    return error;
};

const forbidden = (message = "You are not the owner of this subscription") => {
    const error = new Error(message);
    error.statusCode = 403;
    return error;
};

const findOwnedSubscription = async (id, userId) => {
    const Subscription = await subscription.findById(id);

    if (!Subscription) throw notFound();
    if (Subscription.user.toString() !== userId.toString()) throw forbidden();

    return Subscription;
};

export const createSubscription = async (userId, body) => {
    const Subscription = await subscription.create({
        ...body,
        user: userId,
    });

    let workflowId = null;
    let workflowError = null;

    const forceWorkflow = body.forceWorkflow === true;
    const shouldTriggerWorkflow =
        (NODE_ENV && NODE_ENV.toLowerCase() === "production") || forceWorkflow;

    if (shouldTriggerWorkflow) {
        try {
            const workflowResponse = await workflowClient.trigger({
                url: `${SERVER_URL}/api/v1/workflows/subscriptions/reminder`,
                body: {
                    subscriptionId: Subscription._id.toString(),
                },
                headers: {
                    "content-type": "application/json",
                },
                retries: 0,
            });

            workflowId = workflowResponse.id;
            Subscription.workflowId = workflowId;
            await Subscription.save();
        } catch (error) {
            workflowError = error.message;
        }
    }

    return {
        subscription: Subscription,
        workflow: {
            id: workflowId,
            error: workflowError,
            message: !shouldTriggerWorkflow
                ? "Workflow not triggered: Not in production environment and forceWorkflow flag not set"
                : workflowId
                  ? "Workflow triggered successfully"
                  : "Failed to trigger workflow",
        },
    };
};

export const getUserSubscriptionsById = async (targetUserId, requestingUserId) => {
    if (targetUserId !== requestingUserId.toString()) {
        throw forbidden("You are not the owner of this account");
    }

    return subscription.find({ user: targetUserId });
};

export const getSubscriptionWorkflowStatus = async (subscriptionId, userId) => {
    const Subscription = await subscription.findById(subscriptionId);

    if (!Subscription) throw notFound();
    if (Subscription.user.toString() !== userId.toString()) {
        throw forbidden("You are not authorized to access this subscription");
    }
    if (!Subscription.workflowId) {
        throw notFound("No workflow associated with this subscription");
    }

    try {
        const workflowStatus = await workflowClient.getStatus(Subscription.workflowId);
        return { subscription: Subscription, workflow: workflowStatus };
    } catch (error) {
        const wrapped = new Error(`Failed to retrieve workflow status: ${error.message}`);
        wrapped.statusCode = 502;
        throw wrapped;
    }
};

export const getSubscriptions = async (userId) => {
    return subscription.find({ user: userId });
};

// Converts each frequency's price to a monthly-equivalent cost, so subscriptions
// on different billing cycles can be compared/summed on common ground.
const MONTHLY_FACTOR = {
    daily: 365 / 12,
    weekly: 52 / 12,
    monthly: 1,
    yearly: 1 / 12,
};

const round2 = (n) => Math.round(n * 100) / 100;

// Pure: assumes the caller already filtered to the subscriptions that should
// be included (active, owned by the right user).
export const calculateMonthlySpendingSummary = (subscriptions) => {
    const byCurrency = new Map();

    for (const sub of subscriptions) {
        const monthlyCost = sub.price * MONTHLY_FACTOR[sub.frequency];

        if (!byCurrency.has(sub.currency)) {
            byCurrency.set(sub.currency, { monthlyTotal: 0, activeCount: 0, byCategory: {} });
        }

        const entry = byCurrency.get(sub.currency);
        entry.monthlyTotal += monthlyCost;
        entry.activeCount += 1;
        entry.byCategory[sub.category] = (entry.byCategory[sub.category] || 0) + monthlyCost;
    }

    return Array.from(byCurrency, ([currency, entry]) => ({
        currency,
        monthlyTotal: round2(entry.monthlyTotal),
        activeCount: entry.activeCount,
        byCategory: Object.fromEntries(
            Object.entries(entry.byCategory).map(([category, total]) => [category, round2(total)])
        ),
    }));
};

export const getSpendingSummary = async (userId) => {
    const activeSubscriptions = await subscription
        .find({ user: userId, status: "active" })
        .select("price frequency currency category")
        .lean();
    return calculateMonthlySpendingSummary(activeSubscriptions);
};

export const getUpcomingRenewals = async (userId, days = 7) => {
    const now = new Date();
    const until = new Date();
    until.setDate(until.getDate() + days);

    return subscription
        .find({
            user: userId,
            status: "active",
            renewalDate: { $gte: now, $lte: until },
        })
        .sort({ renewalDate: 1 });
};

export const getSubscription = async (id, userId) => {
    return findOwnedSubscription(id, userId);
};

const UPDATABLE_FIELDS = [
    "name",
    "price",
    "currency",
    "frequency",
    "category",
    "paymentMethod",
    "status",
    "startDate",
    "renewalDate",
];

export const updateSubscription = async (id, userId, updates) => {
    const Subscription = await findOwnedSubscription(id, userId);

    UPDATABLE_FIELDS.forEach((field) => {
        if (updates[field] !== undefined) {
            Subscription[field] = updates[field];
        }
    });

    await Subscription.save();
    return Subscription;
};

export const deleteSubscription = async (id, userId) => {
    const Subscription = await findOwnedSubscription(id, userId);
    await Subscription.deleteOne();
};

export const cancelSubscription = async (id, userId) => {
    const Subscription = await findOwnedSubscription(id, userId);
    Subscription.status = "cancelled";
    await Subscription.save();
    return Subscription;
};
