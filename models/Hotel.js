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

    facilities: { type: facilitiesSchema, required: true },

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