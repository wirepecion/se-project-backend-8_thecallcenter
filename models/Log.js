const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },

    type: {
        type: String,
        enum: ['REFUND', 'PAYMENT', 'WARNING','MEMBERSHIP'],
        required: true
    },

    action: {
        type: String,
        required: true
    },

    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Log', LogSchema);