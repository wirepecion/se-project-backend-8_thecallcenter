const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    hotel:{
        type: mongoose.Schema.ObjectId,
        ref: 'Hotel',
        required: true
    },
    type:{
        type: String,
        enum: ['standard','superior','deluxe','suite'],
        default: 'standard'
    },
    number:{
        type: Number,
        required: true
    },
    price:{
        type: Number,
        required: true
    },
    unavailablePeriod:[{
        startDate:{
            type: Date,
            required: true
        },
        endDate:{
            type: Date,
            required: true
        }
    }]
});

module.exports=mongoose.model('Room',RoomSchema);