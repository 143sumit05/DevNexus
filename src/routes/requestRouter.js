
const ConnectionRequest = require("../models/connectionRequest");
const userAuth = require("../middlewares/auth");
const mongoose = require("mongoose");
const express = require("express");
const User = require("../models/user");

const requestRouter = express.Router();

const getIndiaDate = () => {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
};

// GET FEED: DAILY LIMIT + CURSOR PAGINATION
requestRouter.get("/feed", userAuth, async (req, res) => {
    try {
        const loggedInUser = await User.findById(req.user._id);

        if (!loggedInUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const today = getIndiaDate();
        let limit = Number(req.query.limit ?? 10);
        const lastId = req.query.lastId;

        if (!Number.isInteger(limit) || limit < 1) {
            return res.status(400).json({ message: "Invalid limit" });
        }

        limit = Math.min(limit, 50);

        if (lastId && !mongoose.Types.ObjectId.isValid(lastId)) {
            return res.status(400).json({ message: "Invalid cursor" });
        }

        const isPremium = loggedInUser.isPremium;

        // Reset daily free quota
        if (!isPremium && loggedInUser.dailyFeedDate !== today) {
            loggedInUser.dailyFeedDate = today;
            loggedInUser.dailyFeedCount = 0;
            await loggedInUser.save();
        }

        let remaining = null;

        if (!isPremium) {
            remaining = Math.max(
                0,
                15 - (loggedInUser.dailyFeedCount || 0)
            );

            if (remaining === 0) {
                return res.json({
                    data: [],
                    isPremium: false,
                    remaining: 0,
                    limitReached: true,
                    nextCursor: null
                });
            }

            limit = Math.min(limit, remaining);
        }

        // Exclude users with existing requests in either direction
        const requests = await ConnectionRequest.find({
            $or: [
                { fromUserId: loggedInUser._id },
                { toUserId: loggedInUser._id }
            ]
        }).select("fromUserId toUserId");

        const excludedUsers = [
            loggedInUser._id,
            ...requests.map(r => r.fromUserId),
            ...requests.map(r => r.toUserId)
        ];

        // Cursor pagination
        const query = {
            _id: {
                $nin: excludedUsers
            }
        };

        if (lastId) {
            query._id.$gt = new mongoose.Types.ObjectId(lastId);
        }

        const feedUsers = await User.find(query)
            .select("firstName lastName age gender photoUrl skills")
            .sort({ _id: 1 })
            .limit(limit);

        // Update daily quota atomically
        if (!isPremium && feedUsers.length > 0) {
            const updatedUser = await User.findOneAndUpdate(
                {
                    _id: loggedInUser._id,
                    dailyFeedDate: today,
                    dailyFeedCount: loggedInUser.dailyFeedCount || 0
                },
                {
                    $inc: { dailyFeedCount: feedUsers.length }
                },
                {
                    returnDocument: "after"
                }
            );

            if (!updatedUser) {
                return res.status(409).json({
                    message: "Feed count changed. Please refresh."
                });
            }

            remaining = Math.max(0, 15 - updatedUser.dailyFeedCount);
        }

        const nextCursor = feedUsers.length
            ? feedUsers[feedUsers.length - 1]._id
            : null;

        res.json({
            message: "UI FEED",
            data: feedUsers,
            isPremium,
            remaining,
            limitReached: !isPremium && remaining === 0,
            nextCursor
        });

    } catch (err) {
        console.error("Feed API error:", err);
        res.status(500).json({ message: "Something went wrong" });
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
            return res.status(404).send("User not found");
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

        await ConnectionRequest.create({
            fromUserId,
            toUserId,
            status
        });

        res.send("Connection request sent");

    } catch (err) {
        console.error("Send request error:", err);
        res.status(500).send("Something went wrong");
    }
});

// ACCEPT / REJECT CONNECTION REQUEST
requestRouter.patch("/recieve/:status/:requestId", userAuth, async (req, res) => {
    try {
        const { requestId, status } = req.params;

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).send("Invalid status");
        }

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).send("Invalid request ID");
        }

        const connectionRequest = await ConnectionRequest.findOne({
            _id: requestId,
            toUserId: req.user._id,
            status: "interested"
        });

        if (!connectionRequest) {
            return res.status(404).send("Connection request not found");
        }

        connectionRequest.status = status;
        await connectionRequest.save();

        res.send(`Connection request ${status} successfully`);

    } catch (err) {
        console.error("Receive request error:", err);
        res.status(500).send("Something went wrong");
    }
});

module.exports = requestRouter;
