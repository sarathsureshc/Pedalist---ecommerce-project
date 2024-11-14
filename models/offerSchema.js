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
    offerGroup:{
        type : String,
        required: true,
        enum:['Global','Product','Category','Brand','Referral']
    },    
    productsIncluded:{
        type:Array,
        ref: 'Product',
        default: null,
    },
    categoriesIncluded:  {
        type:Array,
        ref: 'Category',
        default: null,
    },
    brandsIncluded: {
        type:Array,
        ref: 'Brand',
        default: null,
    },
    minPurchaseAmount: {
        type: Number,
    },
    maxDiscountAmount:{
        type:Number,
    },
    offerType: {
        type: String,
        enum:['Percentage','Flat','null']
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
    },
    isDeleted:{
        type:Boolean,
        required: true,
        default: false
    }
})

const Offer = Mongoose.model("Offer",offerSchema);

module.exports = Offer;