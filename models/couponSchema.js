const Mongoose = require("mongoose");
const { Schema } = Mongoose;

const couponSchema =  new Schema({
    couponCode:{
        type:String,
        required:true,
        unique:true
    },
    discountDescription:{
        type:String,
        required:true
        },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    minPurchaseAmount: {
        type: Number,
        required: true
    },
    maxDiscountAmount:{
        type:Number,
        required:true
    },
    discountType: {
        type: String,
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    isActive:{
        type:Boolean,
        required:true,
        default:true
    },
    isDeleted:{
        type: Boolean,
        required: true,
        default: false
    }
})

const Coupon = Mongoose.model("Coupon",couponSchema);

module.exports = Coupon;