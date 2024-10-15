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
        type: String,
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
    price : {
        type: Number,
        required : true
    },
    stockQuantity : {
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
        default: true
    },
    createdOn : {
        type: Date,
        default: Date.now,
        required: true
    },
})

const Product = Mongoose.model("Product",productSchema)

module.exports = Product;