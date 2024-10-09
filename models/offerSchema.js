const Mongoose = require("mongoose");
const { Schema } = Mongoose;

const offerSchema =  new Schema({
    offerName:{
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
    productsIncluded:{
        type:Array,
        required:true,
        ref: 'Product'
    },
    categoriesIncluded:  {
        type:Array,
        required:true,
        ref: 'Category'
    },
    minPurchaseAmount: {
        type: Number,
        required: true
    },
    maxDiscountAmount:{
        type:Number,
        required:true
    },
    offerType: {
        type: String,
        required: true
    },
    offerValue: {
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