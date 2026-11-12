
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Message = require("../models/message");
const ConnectionRequest = require("../models/connectionRequest");

const getConversationId = (userId1, userId2) => {
    return [userId1.toString(), userId2.toString()]
        .sort()
        .join("_");
};

const isConnected = async (userId1, userId2) => {
    const connection = await ConnectionRequest.findOne({
        status: "accepted",
        $or: [
            { fromUserId: userId1, toUserId: userId2 },
            { fromUserId: userId2, toUserId: userId1 }
        ]
    });

    return !!connection;
};

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: [
                process.env.FRONTEND_URL,
                "http://localhost:5173"
            ],
            credentials: true
        }
    });

    // Authenticate using the existing JWT cookie
    io.use(async (socket, next) => {
        try {
            const cookieHeader =
                socket.handshake.headers.cookie || "";

            const token = cookieHeader
                .split(";")
                .map(item => item.trim())
                .find(item => item.startsWith("token="))
                ?.slice(6);

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            const user = await User.findById(decoded.id);

            if (!user) {
                return next(new Error("User not found"));
            }

            socket.user = user;
            next();

        } catch (err) {
            console.error("SOCKET AUTH ERROR:", err);
            next(new Error("Invalid authentication"));
        }
    });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.user._id.toString());

        // Join a one-to-one conversation
        socket.on("joinChat", async ({ targetUserId }, callback) => {
            try {
                if (!targetUserId) {
                    return callback?.({
                        error: "Target user required"
                    });
                }

                if (
                    socket.user._id.toString() ===
                    targetUserId.toString()
                ) {
                    return callback?.({
                        error: "Cannot chat with yourself"
                    });
                }

                const allowed = await isConnected(
                    socket.user._id,
                    targetUserId
                );

                if (!allowed) {
                    return callback?.({
                        error: "You are not connected with this user"
                    });
                }

                const conversationId = getConversationId(
                    socket.user._id,
                    targetUserId
                );

                socket.join(conversationId);

                callback?.({
                    success: true,
                    conversationId
                });

            } catch (err) {
                console.error("Join chat error:", err);
                callback?.({
                    error: "Could not join chat"
                });
            }
        });

        // Send and save messages
        socket.on("sendMessage", async ({ receiverId, message }, callback) => {
            try {
                if (
                    !receiverId ||
                    typeof message !== "string" ||
                    !message.trim() ||
                    message.length > 2000
                ) {
                    return callback?.({
                        error: "Invalid message"
                    });
                }

                const allowed = await isConnected(
                    socket.user._id,
                    receiverId
                );

                if (!allowed) {
                    return callback?.({
                        error: "You are not allowed to message this user"
                    });
                }

                const receiver = await User.findById(receiverId);

                if (!receiver) {
                    return callback?.({
                        error: "User not found"
                    });
                }

                const conversationId = getConversationId(
                    socket.user._id,
                    receiverId
                );

                // Ensure sender joined the conversation first
                if (!socket.rooms.has(conversationId)) {
                    return callback?.({
                        error: "Join the chat first"
                    });
                }

                // Save message in MongoDB first
                const newMessage = await Message.create({
                    senderId: socket.user._id,
                    receiverId,
                    conversationId,
                    message: message.trim()
                });

                // Deliver to connected members
                io.to(conversationId).emit(
                    "receiveMessage",
                    newMessage
                );

                callback?.({
                    success: true,
                    message: newMessage
                });

            } catch (err) {
                console.error("Send message error:", err);
                callback?.({
                    error: "Message could not be sent"
                });
            }
        });

        socket.on("disconnect", () => {
            console.log(
                "User disconnected:",
                socket.user._id.toString()
            );
        });
    });

    return io;
};

module.exports = initializeSocket;
