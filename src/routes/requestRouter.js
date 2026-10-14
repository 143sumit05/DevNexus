const express = require('express');
const requestRouter = express.Router();
const User = require('../models/user');

requestRouter.get("/feed",async(req,res)=>{
    const users = req.body.emailId;
    try{
        const user = await User.find({})
        res.send(user);
    }
    catch(err){
        res.status(400).send("Something went wrong");
    }
})

module.exports = requestRouter;