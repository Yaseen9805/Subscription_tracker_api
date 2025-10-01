import { Router } from "express";
import { signin, signout, signup } from "../controllers/auth.controller.js";

const authrouter=Router();

authrouter.post("/signup",signup);
authrouter.post("/signin",signin);
authrouter.post("/signout",signout);

export default authrouter;