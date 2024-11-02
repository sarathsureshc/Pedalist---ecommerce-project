const Mongoose = require("mongoose");
const { Schema } = Mongoose;


const productSchema =  new Schema({
    productName : {
        type: String,
        required: true
    },
    image : {
        type: [String],
        required: true
    },
    brand : {
        type : Schema.Types.ObjectId,
        ref : 'Brand',
        required: true
    },
    specification1 : {
        type: String,
        required: true
    },
    specification2 : {
        type: String,
        required: true
    },
    specification3 : {
        type: String,
        required: true
    },
    specification4 : {
        type: String,
        required: true
    },
    description : {
        type: String,
        required: true
    },
    color : {
        type: String,
        required: true
    },
    price : {
        type: Number,
        required : true
    },
    discountedPrice : {
        type: Number,
        default: 0,
        required: true
    },
    quantity : {
        type: Number,
        required: true
    },
    category : {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required : true
    },
    isListed : {
        type: Boolean,
        default: true,
        required: true
    },
    isDeleted:{
        type: Boolean,
        default: false,
        required: true
    },
    createdOn : {
        type: Date,
        default: Date.now,
        required: true
    },
    status:{
        type:String,
        enum:["Available","Out of Stock","Discontinued"],
        required:true,
        default:"Available"
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    }
})

const Product = Mongoose.model("Product",productSchema)

module.exports = Product;