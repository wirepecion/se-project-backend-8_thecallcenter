const mongoose = require('mongoose');
const Hotel = require('./Hotel');

const BookingSchema = new mongoose.Schema({

    bookingDate: {
        type: Date,
        required: [true, 'Please add a booking date']
    },

    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },

    hotel: {
        type: mongoose.Schema.ObjectId,
        ref: 'Hotel',
        required: true
    }

});

module.exports = mongoose.model('Booking', BookingSchema);