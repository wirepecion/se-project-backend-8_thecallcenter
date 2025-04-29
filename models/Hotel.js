const mongoose = require('mongoose');
const membershipEnum = ['unavailable','none', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];

const facilityItemSchema = new mongoose.Schema({
    name: {
      type: String,
      enum: [
        'swimmingPool', 'carPark', 'gym', 'breakfast', 'spa',
        'wifi', 'roomService', 'airportShuttle', 'restaurant', 'bar',
        'laundry', 'kidsClub', 'petFriendly', 'businessCenter',
        'meetingRooms', 'beachAccess', 'valetParking', 'rooftopLounge'
      ],
      required: true
    },
    rank: {
      type: String,
      enum: membershipEnum, // e.g. ['none', 'silver', 'gold', 'platinum']
      required: true
    }
  }, { _id: false });
  
const HotelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true,'Please add a name'],
        unique: true,
        trim:true,
        maxlength:[50,'Name can not be more than 50 characters']
    },

    address:{
        type: String,
        required: [true, 'Please add an address']
    },

    tel:{
        type: String
    },
    
    picture:{
        type: String
    },

    facilities: {
        type: [facilityItemSchema],
        required: true
    },

    subscriptionRank: {
        type: Number,
        required: true,
    },

    viewStatistics: {
        type: Number,
        default: 0
    },

},
{
    toJSON: {virtuals:true},
    toObject: {virtuals:true}
});

//Reverse populate with virtuals
HotelSchema.virtual('bookings',{
    ref:'Booking',
    localField:'_id',
    foreignField:'hotel',
    justOne:false
});

HotelSchema.virtual('rooms',{
    ref:'Room',
    localField:'_id',
    foreignField:'hotel',
    justOne:false
});

module.exports=mongoose.model('Hotel',HotelSchema);