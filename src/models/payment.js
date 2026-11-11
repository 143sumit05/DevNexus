
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    paymentId: {
        type: String,
        default: null,

    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['created', 'paid', 'failed'],
        default: 'created'
    }
}, {
    timestamps: true
});
paymentSchema.index(
    { paymentId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            paymentId: { $type: "string" }
        }
    }
);
module.exports = mongoose.model('Payment', paymentSchema);
