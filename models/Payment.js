const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.ObjectId,
        ref: 'Booking',
        required: true
    },

    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    
    amount: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        enum: ['unpaid', 'pending', 'completed', 'failed', 'canceled'],
        default: 'unpaid',
        required: true
    },

    method: {
        type: String,
        enum: ['Card', 'Bank', 'ThaiQR'],
        required: true
    },

    paymentDate: {
        type: Date,
        default: Date.now
    },
    
    canceledAt: {
        type: Date
    },
});

module.exports = mongoose.model('Payment', PaymentSchema);