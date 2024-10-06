const Mongoose = require("mongoose");
const { Schema } = Mongoose;

const couponSchema =  new Schema({
    coupon_code:{
        type:String,
        required:true,
        unique:true
    },
    Image:{
        type:String,
        required:true
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
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    }
})

const Coupon = mongoose.model("Coupon",couponSchema);

module.exports = Coupon;