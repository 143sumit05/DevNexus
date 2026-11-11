
const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const userAuth = require("../middlewares/auth");
const Payment = require("../models/payment");
const User = require("../models/user");

const paymentRouter = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// CREATE ORDER
paymentRouter.post("/payment/create-order", userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isPremium) {
            return res.status(400).json({
                message: "Already a premium member"
            });
        }

        const order = await razorpay.orders.create({
            amount: 19900,
            currency: "INR",
            receipt: `premium_${Date.now()}`
        });

        await Payment.create({
            userId: user._id,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency
        });

        return res.status(201).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (err) {
        console.error("Create order error:", err);
        return res.status(500).json({
            message: "Failed to create payment order"
        });
    }
});

// VERIFY PAYMENT
paymentRouter.post("/payment/verify", userAuth, async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                message: "Missing payment details"
            });
        }

        const payment = await Payment.findOne({
            orderId: razorpay_order_id,
            userId: req.user._id
        });

        if (!payment) {
            return res.status(404).json({
                message: "Payment order not found"
            });
        }

        // Handle already verified payments safely
        if (payment.status === "paid") {
            await User.findByIdAndUpdate(req.user._id, {
                $set: { isPremium: true }
            });

            return res.json({
                message: "Payment already verified",
                isPremium: true
            });
        }

        // Verify Razorpay signature
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (
            !/^[a-f0-9]{64}$/i.test(razorpay_signature) ||
            !crypto.timingSafeEqual(
                Buffer.from(generatedSignature, "hex"),
                Buffer.from(razorpay_signature, "hex")
            )
        ) {
            return res.status(400).json({
                message: "Payment signature verification failed"
            });
        }

        // Fetch actual payment details from Razorpay
        let razorpayPayment = await razorpay.payments.fetch(
            razorpay_payment_id
        );

        if (
            razorpayPayment.order_id !== razorpay_order_id ||
            razorpayPayment.amount !== payment.amount ||
            razorpayPayment.currency !== payment.currency
        ) {
            return res.status(400).json({
                message: "Payment details mismatch"
            });
        }

        // Capture payment if it is only authorized
        if (razorpayPayment.status === "authorized") {
            razorpayPayment = await razorpay.payments.capture(
                razorpay_payment_id,
                payment.amount,
                payment.currency
            );
        }

        if (razorpayPayment.status !== "captured") {
            return res.status(400).json({
                message: `Payment not captured. Current status: ${razorpayPayment.status}`
            });
        }

        // Mark payment as paid
        payment.paymentId = razorpay_payment_id;
        payment.status = "paid";
        await payment.save();

        // Activate Premium
        await User.findByIdAndUpdate(req.user._id, {
            $set: {
                isPremium: true,
                premiumSince: new Date()
            }
        });

        return res.json({
            message: "Payment verified! Welcome to NeXora Premium.",
            isPremium: true
        });

    } catch (err) {
        console.error("Payment verification error:", err);

        return res.status(500).json({
            message: err.message || "Payment verification failed"
        });
    }
});

module.exports = paymentRouter;
