const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');

const UserSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Please add a name']
    },

    tel:{
        type: String,
        required:[true,'Please add a telephone number'],
        match: [
            /^[0-9]{10}$/,
            'Telephone number must have 10 digits'
        ]
    },

    email:{
        type: String,
        required:[true,'Please add an email'],
        unique: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please add a valid email'
        ]
    },

    role: {
        type:String,
        enum: ['user','admin','hotelManager'],
        default: 'user'
    },

    password: {
        type:String,
        required:[true,'Please add a password'],
        minlength: 6,
        select: false
    },

    credit:{
        type: Number,
        default: 0
    },

    membershipTier:{
        type: String,
        enum: ['none', 'bronze', 'silver', 'gold', 'platinum', 'diamond'],
    },

    membershipPoints:{
        type: Number
    },

    responsibleHotel:{
        type: mongoose.Schema.ObjectId,
        ref: 'Hotel'
    },

    resetPasswordToken: String,

    resetPasswordExpire: Date,
    
    createdAt:{
        type: Date,
        default:Date.now
    }
});

//Encrypt password using bcrypt
/* istanbul ignore next */
UserSchema.pre('save',async function(next) {
    if (!this.isModified('password')) return next();  //Prevent hashing if password is not modified
    const salt=await bcrypt.genSalt(10);
    this.password=await bcrypt.hash(this.password,salt);
});

//Sign JWT and return
/* istanbul ignore next */
UserSchema.methods.getSignedJwtToken=function(){
    return jwt.sign({id:this._id},process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRE
    });
};

//Match user entered password to hashed password in database
/* istanbul ignore next */
UserSchema.methods.matchPassword=async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
}

module.exports = mongoose.model('User',UserSchema);