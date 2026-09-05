import { Router } from "express";
import { sendReminders } from "../controllers/workflow.controller.js";

const workflowrouter = Router();

workflowrouter.post('/subscriptions/reminder', sendReminders);

export default workflowrouter;