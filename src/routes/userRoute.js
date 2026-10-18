const express = require('express');
const userRouter = express.Router();
const userAuth = require('../middlewares/auth');
const connectionRequest = require('../models/connectionRequest');

userRouter.get("/user/pendingRequest",userAuth,async(req,res)=>{
    try{
        const loggedInUser = req.user;
        const pendingRequest = await connectionRequest.find({
            toUserId: loggedInUser._id,
            status:"interested"
        }).select("status fromUserId toUserId -_id");
        res.json({
            message: "Pending Requests",
            data: pendingRequest
        })

    }
    catch(err){
        res.status(400).send("Something went wrong");
    }
})

userRouter.get("/user/connections",userAuth,async(req,res)=>{
    try{
        const loggedInUser = req.user;
        const connections = await connectionRequest.find({
            $or:[{
                fromUserId: loggedInUser._id},
                {toUserId: loggedInUser._id
            }],
            status: "accepted"
        })
        .populate("fromUserId", "firstName lastName")
        .populate("toUserId", "firstName lastName");

        const data = connections.map((connection) => {
            if (connection.fromUserId._id.equals(loggedInUser._id)) {
                return connection.toUserId;
            }
            return connection.fromUserId;
        });

        res.json({
            message: "List of connections",
            data
        });
        
    }
    catch(err){
        res.status(400).send("Something went wrong");
    }
})





module.exports = userRouter;