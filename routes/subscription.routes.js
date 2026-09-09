import { Router } from "express";
import authorize from "../middlewares/auth.middlewares.js";
import { validate } from "../middlewares/validate.middlewares.js";
import {
    createSubscriptionSchema,
    updateSubscriptionSchema,
} from "../validations/subscription.validation.js";
import {
    createsubscription,
    getusersubscription,
    getWorkflowStatus,
    getSubscriptions,
    getUpcomingRenewals,
    getSubscription,
    updateSubscription,
    deleteSubscription,
    cancelSubscription,
} from "../controllers/subscription.controller.js";

const Subscriptionrouter = Router();

Subscriptionrouter.get("/", authorize, getSubscriptions);
Subscriptionrouter.get("/upcoming-renewals", authorize, getUpcomingRenewals);
Subscriptionrouter.get("/user/:id", authorize, getusersubscription);
Subscriptionrouter.get("/:subscriptionId/workflow", authorize, getWorkflowStatus);
Subscriptionrouter.get("/:id", authorize, getSubscription);
Subscriptionrouter.post("/", authorize, validate(createSubscriptionSchema), createsubscription);

Subscriptionrouter.put("/:id", authorize, validate(updateSubscriptionSchema), updateSubscription);
Subscriptionrouter.delete("/:id", authorize, deleteSubscription);

Subscriptionrouter.put("/:id/cancel", authorize, cancelSubscription);
export default Subscriptionrouter;
