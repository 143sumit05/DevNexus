const ConnectionRequest = require('../models/connectionRequest');
const userAuth = require('../middlewares/auth');
const mongoose = require('mongoose');
const express = require('express');

const requestRouter = express.Router();
const User = require('../models/user');
// FEED API WITH CURSOR PAGINATION
requestRouter.get("/feed", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;

        let limit = Number(req.query.limit ?? 10);
        const lastId = req.query.lastId;

        if (!Number.isInteger(limit) || limit < 1) {
            return res.status(400).send("Invalid limit");
        }

        limit = Math.min(limit, 50);

        if (lastId && !mongoose.Types.ObjectId.isValid(lastId)) {
            return res.status(400).send("Invalid lastId");
        }

        const hideFromFeed = await ConnectionRequest.find({
            $or: [
                { fromUserId: loggedInUser._id },
                { toUserId: loggedInUser._id }
            ]
        });

        const hideUsers = new Set();

        hideFromFeed.forEach((request) => {
            hideUsers.add(request.fromUserId.toString());
            hideUsers.add(request.toUserId.toString());
        });

        hideUsers.add(loggedInUser._id.toString());

        const query = {
            _id: {
                $nin: Array.from(hideUsers)
            }
        };

        if (lastId) {
            query._id.$gt = new mongoose.Types.ObjectId(lastId);
        }

        const feedUser = await User.find(query)
            .select("firstName lastName age gender")
            .sort({ _id: 1 })
            .limit(limit);

        res.json({
            message: "UI FEED",
            data: feedUser,
            nextCursor: feedUser.length > 0
                ? feedUser[feedUser.length - 1]._id
                : null
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).send("Something went wrong");
    }
});


// SEND CONNECTION REQUEST
requestRouter.post("/request/:status/:toUserId", userAuth, async (req, res) => {
    try {
        const { status, toUserId } = req.params;

        if (!["interested", "ignored"].includes(status)) {
            return res.status(400).send("Invalid connection request");
        }

        if (!mongoose.Types.ObjectId.isValid(toUserId)) {
            return res.status(400).send("Invalid user Id");
        }

        const toUser = await User.findById(toUserId);

        if (!toUser) {
            return res.status(400).send("User not found");
        }

        const fromUserId = req.user._id;

        if (fromUserId.equals(toUserId)) {
            return res.status(400).send("Cannot send request to yourself");
        }

        const existingRequest = await ConnectionRequest.findOne({
            $or: [
                { fromUserId, toUserId },
                { fromUserId: toUserId, toUserId: fromUserId }
            ]
        });

        if (existingRequest) {
            return res.status(400).send("Connection request already exists");
        }

        const connectionRequest = new ConnectionRequest({
            fromUserId,
            toUserId,
            status
        });

        await connectionRequest.save();

        res.send("Connection request sent");
    }
    catch (err) {
        res.status(400).send(err.message);
    }
});


// ACCEPT / REJECT CONNECTION REQUEST
requestRouter.patch("/recieve/:status/:requestId", userAuth, async (req, res) => {
    try {
        const { requestId, status } = req.params;
        const loggedIn = req.user;

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).send("Invalid status");
        }

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).send("Invalid request ID");
        }

        const connectionRequest = await ConnectionRequest.findOne({
            _id: requestId,
            toUserId: loggedIn._id,
            status: "interested"
        });

        if (!connectionRequest) {
            return res.status(404).send("Connection request not found");
        }

        connectionRequest.status = status;
        await connectionRequest.save();

        res.send("Connection request " + status + " successfully");
    }
    catch (err) {
        res.status(500).send("Something went wrong");
    }
});





module.exports = requestRouter;