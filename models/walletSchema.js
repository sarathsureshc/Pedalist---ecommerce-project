import { transformAuthInfo } from "passport";

const mongoose = require("mongoose");
const {Schema} = mongoose;

const walletSchema = new Schema({
    userId : {
        type : Schema.types.ObjectId,
        ref : 'User',
        required : true,
    },
    balance : {
        type : Number,
        default : 0,
    },
    card : [{
        cardId : {  
            type : Schema.types.ObjectId,
            required : true,
          },
          cardNumber : {
            type : Number,
            required : true,
          },
          cardName : {  
            type : String,
            required : true,
          },
          expiresAt : {
            type : Date,
            required : true,
          },
          cvv : {
            type : Number,
            required : true,
          }
    }],
    transaction : [{
        transactionId : {
            type : Schema.Types.ObjectId,
            required : true,
        },
        transactionType : {
            type : String,
            enum : ['Debit', 'Credit'],
            required : true,
        },
        transactionDate : {
            type : Date,
            required : true,
            default : Date.now()  
        },
        reference : {
            type : String,
        },
        orderId : {
            type : Schema.Types.ObjectId,
            ref : 'Order'
        },
        amount : {
            type : Number,
            required : true,
        },
        description : {
            type : String,
        }

    }]
})