import { Router } from "express";
import { signin, signup } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middlewares.js";
import { signinSchema, signupSchema } from "../validations/auth.validation.js";

const authrouter = Router();

authrouter.post("/signup", validate(signupSchema), signup);
authrouter.post("/signin", validate(signinSchema), signin);

export default authrouter;
