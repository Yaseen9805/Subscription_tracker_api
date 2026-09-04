import * as subscriptionService from "../services/subscription.service.js";

export const createsubscription = async (req, res, next) => {
    try {
        const { subscription, workflow } = await subscriptionService.createSubscription(req.user._id, req.body);

        res.status(201).json({
            success: true,
            data: subscription,
            workflow,
        });
    } catch (error) {
        next(error);
    }
};

export const getusersubscription = async (req, res, next) => {
    try {
        const Subscriptions = await subscriptionService.getUserSubscriptionsById(req.params.id, req.user.id);

        res.status(200).json({
            success: true,
            data: Subscriptions,
        });
    } catch (error) {
        next(error);
    }
};

export const getWorkflowStatus = async (req, res, next) => {
    try {
        const data = await subscriptionService.getSubscriptionWorkflowStatus(req.params.subscriptionId, req.user._id);

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        next(error);
    }
};

export const getSubscriptions = async (req, res, next) => {
    try {
        const Subscriptions = await subscriptionService.getSubscriptions(req.user._id);

        res.status(200).json({
            success: true,
            data: Subscriptions,
        });
    } catch (error) {
        next(error);
    }
};

export const getUpcomingRenewals = async (req, res, next) => {
    try {
        const days = Number(req.query.days) || 7;
        const Subscriptions = await subscriptionService.getUpcomingRenewals(req.user._id, days);

        res.status(200).json({
            success: true,
            data: Subscriptions,
        });
    } catch (error) {
        next(error);
    }
};

export const getSubscription = async (req, res, next) => {
    try {
        const Subscription = await subscriptionService.getSubscription(req.params.id, req.user._id);

        res.status(200).json({
            success: true,
            data: Subscription,
        });
    } catch (error) {
        next(error);
    }
};

export const updateSubscription = async (req, res, next) => {
    try {
        const Subscription = await subscriptionService.updateSubscription(req.params.id, req.user._id, req.body);

        res.status(200).json({
            success: true,
            data: Subscription,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteSubscription = async (req, res, next) => {
    try {
        await subscriptionService.deleteSubscription(req.params.id, req.user._id);

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        next(error);
    }
};

export const cancelSubscription = async (req, res, next) => {
    try {
        const Subscription = await subscriptionService.cancelSubscription(req.params.id, req.user._id);

        res.status(200).json({
            success: true,
            data: Subscription,
        });
    } catch (error) {
        next(error);
    }
};
