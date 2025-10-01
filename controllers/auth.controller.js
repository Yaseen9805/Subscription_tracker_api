import mongoose from "mongoose";
import User from "../models/user.model.js"; 
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import {JWT_EXPIRES_IN,JWT_SECRET} from '../config/env.js'

export const signup=async function (req,res,next) {
    const session= await mongoose.startSession();
    session.startTransaction();
    try{
        const {name,email,password}=req.body;
        const existinguser=await User.findOne({email});

        if(existinguser){
            const error=new Error("already exists");
            error.statusCode=409;
            throw error;
        }
        const salt=await bcrypt.genSalt(10);
        const hashedpassword=await bcrypt.hash(password,salt);

        const newuser=await User.create([{name,email,password:hashedpassword}],{session});

        const token=jwt.sign({userId:newuser[0]._id},JWT_SECRET,{expiresIn:JWT_EXPIRES_IN})

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success:true,
            message:'User created Successfully',
            data:{
                token,
                user:newuser[0],
            }
        })
    }catch(error){
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
}
export const signin=async function (req,res,next) {
    try{
        const{email,password}= req.body;
        const user=await User.findOne({email});

        if(!user){
            const error=new Error('User not found');
            error.statusCode=404;
            throw error;
        }
        const ispasswordvalid=await bcrypt.compare(password,user.password)
        if(!ispasswordvalid){
            const error=new Error('invalid password');
            error.statusCode=401;
            throw error;        
        }
        const token=jwt.sign({userId:user._id},JWT_SECRET,{expiresIn:JWT_EXPIRES_IN})
        res.status(200).json({
            success:true,
            message:'User signed in Successfully',
            data:{
                token,
                user,
            }
        })
        }catch(error){
            next(error);
        }
    
}
export const signout=async function (req,res,next) {
    
}