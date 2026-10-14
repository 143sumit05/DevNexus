const express = require('express');
const authRouter = express.Router();
const validateData = require('../utils/validate');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');



authRouter.post("/signup",async (req,res)=>{
    try{
        validateData(req);
        req.body.password = await bcrypt.hash(req.body.password,10);
        const user = new User(req.body);
    
        await user.save();
        res.send("Saved to Database");
    }
    catch(err){
        res.status(400).send(err.message);
    }
})

authRouter.post("/login",async (req,res)=>{
    try{
        const {emailId , password} = req.body;
        const user =  await User.findOne({emailId : emailId});
        if(!user){
            throw new Error("Email not registered");
        }
        const pass = await bcrypt.compare(password,user.password);
        if(pass){

            const token = jwt.sign({id: user._id},"mysecretkey");
            res.cookie("token",token);
            
            res.send("Login success");
        }
        else{
            throw new Error("Wrong password");
        }
    }
    catch(err){
        res.status(400).send(err.message);
    }
})


module.exports = authRouter;
