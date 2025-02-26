const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a hotel name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    tel: {
        type: String
    }
},
{
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

//Reverse populate with virtuals
HotelSchema.virtual('hotels',{
    ref:'Hotel',
    localField:'_id',
    foreignField:'hotel',
    justOne:false
});

module.exports = mongoose.model('Hotel', HotelSchema);