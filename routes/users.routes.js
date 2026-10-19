import { Router } from "express";
import { deleteUser, updateUser } from "../controllers/user.controller.js";
import { withoutPassword } from "../utils/sanitize.js";
import authorize from "../middlewares/auth.middlewares.js";
import { validate } from "../middlewares/validate.middlewares.js";
import { updateUserSchema } from "../validations/user.validation.js";

const userrouter = Router();

userrouter.get("/me", authorize, (req, res) => {
    res.status(200).json({ success: true, data: withoutPassword(req.user) });
});

userrouter.put("/:id", authorize, validate(updateUserSchema), updateUser);

userrouter.delete("/:id", authorize, deleteUser);

export default userrouter;
