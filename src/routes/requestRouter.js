const ConnectionRequest = require('../models/connectionRequest');
const userAuth = require('../middlewares/auth');
const mongoose = require('mongoose');
const express = require('express');
const requestRouter = express.Router();
const User = require('../models/user');

requestRouter.get("/feed",userAuth,async(req,res)=>{
    const loggedInUser = req.user;
    try{
        const hideFromFeed = await ConnectionRequest.find({
            $or:[{fromUserId : loggedInUser._id},{toUserId : loggedInUser._id}]
        })
        const hideUsers = new Set();
        hideFromFeed.forEach((req)=>{
            hideUsers.add(req.fromUserId.toString());
            hideUsers.add(req.toUserId.toString());
        })
        hideUsers.add(loggedInUser._id.toString());

        const feedUser = await User.find({
            _id: {$nin: Array.from(hideUsers)}
        }).select("firstName lastName age gender");
        res.json({
            message : "UI FEED",
            data: feedUser
        })
    }
    catch(err){
        res.status(400).send("Something went Wrong");
    }
})

requestRouter.post("/request/:status/:toUserId",userAuth,async(req,res)=>{
    try{
        const {status , toUserId} = req.params;
        if(!["interested","ignored"].includes(status)){
            return res.status(400).send("Invalid connection request");
        }
        if(!mongoose.Types.ObjectId.isValid(toUserId)){
            return res.status(400).send("Invalid user Id");
        }
        const toUser = await User.findById(toUserId);
        if(!toUser){
           return res.status(400).send("user not found");
        }

        const fromUserId = req.user._id;
        if(fromUserId.equals(toUserId)){
           return res.status(400).send("cant send a request to yourself");
        }
        const existingRequest = await ConnectionRequest.findOne({
            $or: [{fromUserId: fromUserId,toUserId: toUserId},
                {fromUserId: toUserId, toUserId: fromUserId}
            ]
        });
        if(existingRequest){
            return res.status(400).send("Connection request already there");
        }
        const connectionRequest = new ConnectionRequest({
            fromUserId,
            toUserId,
            status
        });
        await connectionRequest.save();
        res.send("Connection request sent");
    }
    catch(err){
        res.status(400).send(err.message);
    }
})

requestRouter.patch("/recieve/:status/:requestId",userAuth,async(req,res)=>{
    try{
        const {requestId,status} = req.params;
        const loggedIn = req.user;
        if(!["accepted","rejected"].includes(status)){
            return res.status(400).send("Error! Accepting and rejecting are only allowed");
        }
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).send("Invalid request ID");
        }
        
        const connectionRequest = await ConnectionRequest.findOne({
            _id: requestId,
            toUserId: loggedIn._id,
            status: "interested"
        });
        if(!connectionRequest){
            return res.status(404).send("Error! cant find connection");
        }
        connectionRequest.status = status;
        await connectionRequest.save();
        res.send("connection request " + status + " successfully");
    }
    catch(err){
        res.status(404).send("Error");
    }
})
module.exports = requestRouter;

// Git workflow test