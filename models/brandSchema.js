const mongoose = require('mongoose');
const {Schema} = mongoose;


const brandSchema = new Schema({

    brandName : {
        type : String,
        required : true
    },
    brandImage : {
        type : String,
        required : true
    },
    brandOffer : {
        type : Schema.Types.ObjectId,
        ref : 'Offer'
    },
    isBlocked : {
        type : Boolean,
        default : false
    },
    isDeleted : {
        type : Boolean,
        default : false,
        required : true 
    },
    createdAt : {
        type : Date,
        default : Date.now
    }

})

const Brand = mongoose.model('Brand', brandSchema);
module.exports = Brand;