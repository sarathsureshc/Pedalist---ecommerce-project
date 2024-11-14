const mongoose = require("mongoose");
const {Schema} = mongoose;


const userSchema = new Schema({
    firstName : {
        type : String,
        required : true
    },
    lastName : {
        type : String,
        required : false
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    mobileNumber : {
        type : String,
        required : false,
        unique : false,
        sparse : true,
        default : null
    },
    googleId :  {
        type : String,
        required: false
    },
    password : {
        type : String,
        required : false
    },
    isBlocked : {
        type : Boolean,
        default : false
    },
    isAdmin : {
        type : Boolean,
        default : false
    },
    cart : [{
        type : Schema.Types.ObjectId,
        ref : 'Cart'
    }],
    wallet : {
        type : Schema.Types.ObjectId,
        ref : 'Wallet',
    },
    wishlist : [{
        type : Schema.Types.ObjectId,
        ref : 'Wishlist'
    }],
    orderHistory:[{
        type : Schema.Types.ObjectId,
        ref : 'Order'
    }],
    createdOn : {
        type : Date,
        default : Date.now
    },
    referral:{
        type : String
    },
    referralCode : {
        type : String,
        unique : true
    },
    redeemed : {
        type : Boolean,
    },
    redeemedUsers : [{
        type : Schema.Types.ObjectId,
        ref :  'User'
    }]
})


const User = mongoose.model("User",userSchema);

module.exports = User;