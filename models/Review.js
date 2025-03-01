const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({

    user:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    hotel:{
        type: mongoose.Schema.ObjectId,
        ref: 'Hotel',
        required: true
    },
    rating:{
        type: Number,
        min:1,
        max:5,
        required: true
    },
    comment:{
        type: String,
        trim: true
    },
    images:[
        {
            type: String
        }
    ],
    likes:[
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ],
    dislikes:[
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
},
{
    timestamps:true
});

module.exports=mongoose.model('Review',ReviewSchema);