
require("dotenv").config();

const express = require("express");
const crypto = require("crypto");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/database.js");

const Payment = require("./models/payment.js");
const User = require("./models/user.js");
const WebhookEvent = require("./models/webhookEvent.js");

const authRouter = require("./routes/authRouter.js");
const profileRouter = require("./routes/profileRouter.js");
const requestRouter = require("./routes/requestRouter.js");
const userRouter = require("./routes/userRoute.js");
const paymentRouter = require("./routes/paymentRouter.js");

const app = express();

// CORS
const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:5173"
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// WEBHOOK ROUTE — MUST COME BEFORE express.json()
app.post(
    "/payment/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        try {
            const signature = req.headers["x-razorpay-signature"];
            const eventId = req.headers["x-razorpay-event-id"];

            if (!signature || !eventId) {
                return res.status(400).send("Missing webhook headers");
            }

            if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
                return res.status(500).send("Webhook secret not configured");
            }

            // Verify webhook signature using raw body
            const expectedSignature = crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_WEBHOOK_SECRET
                )
                .update(req.body)
                .digest("hex");

            const signatureBuffer = Buffer.from(signature, "hex");
            const expectedBuffer = Buffer.from(expectedSignature, "hex");

            if (
                !/^[a-f0-9]{64}$/i.test(signature) ||
                !crypto.timingSafeEqual(
                    signatureBuffer,
                    expectedBuffer
                )
            ) {
                return res.status(400).send("Invalid webhook signature");
            }

            const body = JSON.parse(req.body.toString("utf8"));
            const event = body.event;

            // Ignore events we don't handle
            if (
                event !== "payment.captured" &&
                event !== "payment.failed"
            ) {
                return res.status(200).json({
                    message: "Event ignored"
                });
            }

            // Prevent duplicate event processing
            const existingEvent = await WebhookEvent.findOne({
                eventId
            });

            if (existingEvent) {
                return res.status(200).json({
                    message: "Event already processed"
                });
            }

            const razorpayPayment = body.payload?.payment?.entity;

            if (!razorpayPayment) {
                return res.status(400).send("Payment details missing");
            }

            const orderId = razorpayPayment.order_id;

            const payment = await Payment.findOne({
                orderId
            });

            if (!payment) {
                return res.status(200).json({
                    message: "Payment record not found; ignored"
                });
            }

            if (
                razorpayPayment.amount !== payment.amount ||
                razorpayPayment.currency !== payment.currency
            ) {
                return res.status(400).send("Payment details mismatch");
            }

            if (event === "payment.captured") {

                if (razorpayPayment.status !== "captured") {
                    return res.status(400).send("Payment not captured");
                }

                // Activate Premium only once
                if (payment.status !== "paid") {
                    payment.paymentId = razorpayPayment.id;
                    payment.status = "paid";
                    await payment.save();

                    await User.findByIdAndUpdate(payment.userId, {
                        $set: {
                            isPremium: true,
                            premiumSince: new Date()
                        }
                    });
                }
            }

            if (event === "payment.failed") {

                // Never overwrite a successful payment
                if (payment.status !== "paid") {
                    payment.status = "failed";
                    await payment.save();
                }
            }

            // Save processed event ID
            await WebhookEvent.create({
                eventId,
                event
            });

            console.log("Webhook processed:", event, eventId);

            return res.status(200).json({
                message: "Webhook processed successfully"
            });

        } catch (err) {
            if (err.code === 11000) {
                return res.status(200).json({
                    message: "Duplicate webhook event"
                });
            }

            console.error("Webhook error:", err);

            return res.status(500).send("Webhook processing failed");
        }
    }
);

// Normal middleware AFTER webhook
app.use(cookieParser());
app.use(express.json());

// Existing routes
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", paymentRouter);

// Default route
app.use("/", (req, res) => {
    res.end("HEHE SERVER CHALPEYA");
});

// Start server
connectDB()
    .then(() => {
        console.log("Database connection established");

        app.listen(process.env.PORT || 3000, () => {
            console.log("SERVER STARTED");
        });
    })
    .catch((err) => {
        console.log(err);
        console.log("Can't connect to Database");
    });

