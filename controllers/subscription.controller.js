import subscription from "../models/subscription.model.js"
import { workflowClient } from "../config/upstash.js";
import {SERVER_URL, NODE_ENV} from '../config/env.js'

export const createsubscription = async (req, res, next) => {
    try {
        const Subscription = await subscription.create({
            ...req.body,
            user: req.user._id,
        });

        let workflowId = null;
        let workflowError = null;

        // Check if we should trigger the workflow
        // Either in production environment or if forceWorkflow flag is set
        const forceWorkflow = req.body.forceWorkflow === true;
        console.log('Force workflow flag:', forceWorkflow);
        const shouldTriggerWorkflow = (NODE_ENV && NODE_ENV.toLowerCase() === "production") || forceWorkflow;
        
        if (shouldTriggerWorkflow) {
            try {
                console.log('Triggering workflow with URL:', `${SERVER_URL}/api/v1/workflows/subscriptions/reminder`);
                console.log('Subscription ID being sent:', Subscription.id);
                
                const workflowResponse = await workflowClient.trigger({
                    url: `${SERVER_URL}/api/v1/workflows/subscriptions/reminder`,
                    body: {
                        subscriptionId: Subscription._id.toString(),
                    },
                    headers: {
                        'content-type': 'application/json',
                    },
                    retries: 0,
                });
                
                console.log('Workflow response:', JSON.stringify(workflowResponse));
                
                // Extract workflow ID from response
                workflowId = workflowResponse.id;
                
                // Update subscription with workflow ID
                Subscription.workflowId = workflowId;
                await Subscription.save();
                
                console.log('Workflow triggered successfully with ID:', workflowId);
            } catch (error) {
                workflowError = error.message;
                console.error('Failed to trigger workflow:', error.message);
                // Continue execution even if workflow trigger fails
            }
        } else {
            console.log('Skipping workflow trigger: Not in production and forceWorkflow not set');
            // In development without forceWorkflow, we skip the workflow trigger
        }

        res.status(201).json({
            success: true,
            data: Subscription,
            workflow: {
                id: workflowId,
                error: workflowError,
                message: !shouldTriggerWorkflow ? 
                    "Workflow not triggered: Not in production environment and forceWorkflow flag not set" : 
                    (workflowId ? "Workflow triggered successfully" : "Failed to trigger workflow")
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getusersubscription = async (req, res, next) => {
    try {
        if (req.user.id !== req.params.id) {
            const error = new Error('You are not the owner of this account');
            error.status = 401;
            throw error;
        }

        const Subscriptions = await subscription.find({ user: req.params.id });

        res.status(200).json({
            success: true,
            data: Subscriptions
        });
    } catch (error) {
        next(error);
    }
};

export const getWorkflowStatus = async (req, res, next) => {
    try {
        const { subscriptionId } = req.params;
        
        // Find the subscription
        const Subscription = await subscription.findById(subscriptionId);
        
        if (!Subscription) {
            return res.status(404).json({
                success: false,
                error: 'Subscription not found'
            });
        }
        
        // Check if user is authorized to access this subscription
        if (Subscription.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'You are not authorized to access this subscription'
            });
        }
        
        // Check if workflow ID exists
        if (!Subscription.workflowId) {
            return res.status(404).json({
                success: false,
                error: 'No workflow associated with this subscription'
            });
        }
        
        // Get workflow status from QStash
        try {
            const workflowStatus = await workflowClient.getStatus(Subscription.workflowId);
            
            return res.status(200).json({
                success: true,
                data: {
                    subscription: Subscription,
                    workflow: workflowStatus
                }
            });
        } catch (workflowError) {
            return res.status(500).json({
                success: false,
                error: 'Failed to retrieve workflow status',
                details: workflowError.message
            });
        }
    } catch (error) {
        next(error);
    }
};

// No default export needed as we're using named exports
