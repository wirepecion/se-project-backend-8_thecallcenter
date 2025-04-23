const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },

    room: {
        type: mongoose.Schema.ObjectId,
        ref: 'Room',
        required: true
    },

    hotel: {
        type: mongoose.Schema.ObjectId,
        ref: 'Hotel',
        required: true
    },

    checkInDate: {
        type: Date,
        required: true
    },

    checkOutDate: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ['pending', 'confirmed', 'canceled', 'checkedIn', 'completed'],
        default: 'pending'
    },

    tierAtBooking: {
        type: String,
        enum: ['none', 'bronze', 'silver', 'gold', 'platinum', 'diamond'],
        default: 'none',
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

});

BookingSchema.virtual('payments',{
    ref:'Payment',
    localField:'_id',
    foreignField:'booking',
    justOne:false
});

BookingSchema.set('toJSON', { virtuals: true });
module.exports = mongoose.model('Booking', BookingSchema);