import { Router } from "express";
import { getUser, getUsers } from "../controllers/user.controller.js";
import authorize from "../middlewares/auth.middlewares.js";

const userrouter=Router();

userrouter.get("/",getUsers);

userrouter.get("/:id",authorize,getUser);

userrouter.post("/",(req,res)=>{
    res.send({title:"Create new user"});
});

userrouter.put("/:id",(req,res)=>{
    res.send({title:"Update user"});
});

userrouter.delete("/:id",(req,res)=>{
    res.send({title:"Delete user"});
});

export default userrouter;