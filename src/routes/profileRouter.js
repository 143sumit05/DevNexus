const express = require('express');
const profileRouter = express.Router();

const jwt = require('jsonwebtoken');
const User = require('../models/user.js');

// GET PROFILE
profileRouter.get("/profile",async(req,res)=>{

    try{
    const token = req.cookies.token;
    const decoded = jwt.verify(token,"mysecretkey");
    const user =  await User.findById(decoded.id);
    console.log(decoded);
    res.send(user);
    }
    catch(err){
        res.send("Try Logging again");
    }
})
// UPDATE PROFILE
profileRouter.patch("/update/:emailId",async(req,res)=>{

    

    const data = req.body;
    
    const emailId = req.params.emailId;
    
    const allowed = ["firstName","lastName","password"];

    const keys = Object.keys(data);
    for(let key of keys){
        if(!allowed.includes(key)){
            res.status(400).send("Update not allowed");
        }
    }
    try{
        const user = await User.findOneAndUpdate({emailId :emailId},data);
        res.send("Updated");
    }
    catch(err){
        res.status(400).send("Something went WROOOONG");
    }
})



module.exports = profileRouter;