import express from "express";
import { PORT } from "./config/env.js";
import authrouter from "./routes/auth.routes.js";
import Subscriptionrouter from "./routes/subscription.routes.js";
import userrouter from "./routes/users.routes.js";
import connectToDatabase from "./database/mongodb.js";
import errormiddleware from "./middlewares/error.middleware.js";
import cookieParser from "cookie-parser";
import arcjetmiddleware from "./middlewares/arcjet.middlewares.js";
import workflowrouter from "./routes/workflow.routes.js";

const app=express();

app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cookieParser())
app.use(arcjetmiddleware)
app.use('/api/v1/auth',authrouter)
app.use('/api/v1/subscriptions',Subscriptionrouter)
app.use('/api/v1/users',userrouter)
app.use('/api/v1/workflows',workflowrouter) 

app.use(errormiddleware);
app.get("/",(req,res)=>{
    res.send("Welcome to the Subscription Tracker API");


})

app.listen(PORT,async ()=>{
    console.log(`Subscription Tracker API is running on http://localhost:${PORT}`);

    await connectToDatabase();

})

export default app;