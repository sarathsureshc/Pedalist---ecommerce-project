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
        enum:['Global','Product','Category','Brand']
    },    
    productsIncluded:{
        type:Array,
        ref: 'Product'
    },
    categoriesIncluded:  {
        type:Array,
        ref: 'Category'
    },
    brandsIncluded: {
        type:Array,
        ref: 'Brand'
    },
    minPurchaseAmount: {
        type: Number,
    },
    maxDiscountAmount:{
        type:Number,
    },
    offerType: {
        type: String,
        required: true,
        enum:['Percentage','Flat']
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