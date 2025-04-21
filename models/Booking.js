const mongoose = require('mongoose');
const membershipEnum = ['none', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];

const facilitiesSchema = new mongoose.Schema({
        swimmingPool: { type: String, enum: membershipEnum, required: true },
        carPark: { type: String, enum: membershipEnum, required: true },
        gym: { type: String, enum: membershipEnum, required: true },
        breakfast: { type: String, enum: membershipEnum, required: true },
        spa: { type: String, enum: membershipEnum, required: true },
        wifi: { type: String, enum: membershipEnum, required: true },
        roomService: { type: String, enum: membershipEnum, required: true },
        airportShuttle: { type: String, enum: membershipEnum, required: true },
        restaurant: { type: String, enum: membershipEnum, required: true },
        bar: { type: String, enum: membershipEnum, required: true },
        laundry: { type: String, enum: membershipEnum, required: true },
        kidsClub: { type: String, enum: membershipEnum, required: true },
        petFriendly: { type: String, enum: membershipEnum, required: true },
        businessCenter: { type: String, enum: membershipEnum, required: true },
        meetingRooms: { type: String, enum: membershipEnum, required: true },
        beachAccess: { type: String, enum: membershipEnum, required: true },
        valetParking: { type: String, enum: membershipEnum, required: true },
        rooftopLounge: { type: String, enum: membershipEnum, required: true },
  }, { _id: false });

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

    facilities: { type: facilitiesSchema, required: true },

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