const Mongoose = require("mongoose");
const { Schema } = Mongoose;


const categorySchema = new Schema({
    name: {
        type:String,
        required:true,
        unique:true
    },
    description : {
        type : String,
        required : true,
    },
    isListed: {
        type:Boolean,
        default:true
    },
    categoryOffer:{
        type: Number,
        default:0,
    },
    createdAt: {
        type: Date,
        default:Date.now
    }

})

const Category = Mongoose.model("Category",categorySchema);

module.exports = Category;