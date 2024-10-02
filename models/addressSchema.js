const mongoose = require("mongoose");
const {Schema} = mongoose;


const addressSchema = new  Schema({
    userId : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    name : {
        type : String,
        required : true
    },
    houseName : {
        type : String,
        required : true
    },
    streetName : {
        type : String,
        required : true
    },
    landmark : {
        type : String,
        required : true
    },
    locality : {
        type : String,
        required : true
    },
    city : {
        type : String,
        required : true
    },
    state : {
        type : String,
        required : true
    },
    pin : {
        type : String,
        required : true
    },
    contactNo : {
        type : String,
        required : true
    },
})


const Address = mongoose.model("Address",addressSchema);

module.exports = Address;