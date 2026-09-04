import { Router } from "express";
import { createUser, deleteUser, getUser, getUsers, updateUser } from "../controllers/user.controller.js";
import authorize from "../middlewares/auth.middlewares.js";
import { validate } from "../middlewares/validate.middlewares.js";
import { createUserSchema, updateUserSchema } from "../validations/user.validation.js";

const userrouter=Router();

userrouter.get("/",authorize,getUsers);

userrouter.get("/:id",authorize,getUser);

userrouter.post("/",validate(createUserSchema),createUser);

userrouter.put("/:id",authorize,validate(updateUserSchema),updateUser);

userrouter.delete("/:id",authorize,deleteUser);

export default userrouter;