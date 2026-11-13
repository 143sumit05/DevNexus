
const express = require('express');
const userRouter = express.Router();
const userAuth = require('../middlewares/auth');
const connectionRequest = require('../models/connectionRequest');

// PENDING REQUESTS
userRouter.get("/user/pendingRequest", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;

        const pendingRequest = await connectionRequest.find({
            toUserId: loggedInUser._id,
            status: "interested"
        })
        .populate("fromUserId", "firstName lastName photoUrl");

        res.json({
            message: "Pending Requests",
            data: pendingRequest
        });

    } catch (err) {
        res.status(400).send("Something went wrong");
    }
});

// MY CONNECTIONS
userRouter.get("/user/connections", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;

        const connections = await connectionRequest.find({
            $or: [
                { fromUserId: loggedInUser._id },
                { toUserId: loggedInUser._id }
            ],
            status: "accepted"
        })
        .populate("fromUserId", "firstName lastName photoUrl")
        .populate("toUserId", "firstName lastName photoUrl");

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

    } catch (err) {
        res.status(400).send("Something went wrong");
    }
});

module.exports = userRouter;
