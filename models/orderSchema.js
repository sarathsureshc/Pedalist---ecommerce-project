const mongoose = require("mongoose");
const {Schema} = mongoose;
const {v4:uuidv4} = require('uuid');

const orderSchema = new Schema({
    orderId : {
        type:String,
        default:()=>uuidv4(),
        unique:true
    },
    items:[{
        itemOrderId: {
            type:String,
            default:()=>uuidv4(),
            unique:true
        },
        product:{
            type:Schema.Types.ObjectId,
            ref:'Product',
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        status:{
            type:String,
            required:true,
            enum:['Pending','Placed','Shipped','Delivered','Cancelled','Return Request','Returned']
        },
        cancelReason : {
            type: String,
            default:null
        },
        returnReason : {
            type: String,
            default:null
        }

    }],
    totalPrice:{
        type:Number,
        required:true
    },
    discount:{
        type:Number,
        default:0
    },
    finalAmount:{
        type:Number,
        required:true
    },
    address:{
        type:Array,
        ref:'Address',
        required:true
    },
    invoiceDate:{
        type:Date,
        default:Date.now()
    },
    createdOn :{
        type:Date,
        default:Date.now,
        required:true
    },
    coupon:{
        type:Schema.Types.ObjectId,
        ref:'Coupon'
    },
    offer : {
        type: Schema.Types.ObjectId,
        ref: 'Offer'
    },
    userId : {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    paymentMethod:{
        type:String,
        required:true,
        enum:['Cash On Delivery','Card Payment','Wallet','Pending'],
        default : 'Cash On Delivery'
    },
    transactionId:{
        type:String,
        default:null
    },
    paymentStatus:{
        type:String,
        required:true,
        enum:['Pending','Completed','Failed','Refunded']
    }

})

const Order = mongoose.model("Order",orderSchema);

module.exports = Order;