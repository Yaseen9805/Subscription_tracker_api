import { Router } from "express";
import authorize from "../middlewares/auth.middlewares.js";
import { createsubscription, getusersubscription, getWorkflowStatus } from "../controllers/subscription.controller.js";

const Subscriptionrouter=Router();

Subscriptionrouter.get("/",(req,res)=>{
    res.send({title:"Get all subscriptions"});
});
Subscriptionrouter.get("/:id",(req,res)=>{
    res.send({title:"Get subscription Details"});
});
Subscriptionrouter.post("/",authorize,createsubscription);

Subscriptionrouter.put("/:id",(req,res)=>{
    res.send({title:"Update subscription"});
});
Subscriptionrouter.delete("/:id",(req,res)=>{
    res.send({title:"Delete subscription"});
});
Subscriptionrouter.get("/user/:id",authorize,getusersubscription);

Subscriptionrouter.put("/:id/cancel",(req,res)=>{
    res.send({title:"Cancel subscription"});
});
Subscriptionrouter.get("/upcoming-renewals",(req,res)=>{
    res.send({title:"Get upcoming renewals"});
});

Subscriptionrouter.get("/:subscriptionId/workflow", authorize, getWorkflowStatus);
export default Subscriptionrouter;