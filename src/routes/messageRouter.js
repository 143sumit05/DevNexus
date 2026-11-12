const express = require("express");
const mongoose = require("mongoose");

const Message = require("../models/message");
const ConnectionRequest = require("../models/connectionRequest");
const userAuth = require("../middlewares/auth");

const messageRouter = express.Router();

messageRouter.get("/messages/:userId", userAuth, async (req, res) => {
    try {
        const myId = req.user._id;
        const otherUserId = req.params.userId;

        if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        const connection = await ConnectionRequest.findOne({
            status: "accepted",
            $or: [
                { fromUserId: myId, toUserId: otherUserId },
                { fromUserId: otherUserId, toUserId: myId }
            ]
        });

        if (!connection) {
            return res.status(403).json({
                message: "You are not connected with this user"
            });
        }

        const conversationId = [
            myId.toString(),
            otherUserId.toString()
        ].sort().join("_");

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .limit(100);

        res.json(messages);

    } catch (err) {
        console.error("Fetch messages error:", err);
        res.status(500).json({
            message: "Could not fetch messages"
        });
    }
});

module.exports = messageRouter;