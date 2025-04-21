const mongoose = require('mongoose');

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

    facilities:{
        type: [object],
    }

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