const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");

const orderSchema = new Schema({
  orderId: {
    type: String,
    default: () => uuidv4(),
    unique: true,
  },
  items: [
    {
      itemOrderId: {
        type: String,
        default: () => uuidv4(),
        unique: true,
      },
      product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      priceApplied: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        required: true,
        enum: [
          "Pending",
          "Placed",
          "Shipped",
          "Delivered",
          "Cancelled",
          "Return Request",
          "Returned",
        ],
      },
      cancelReason: {
        type: String,
        default: null,
      },
      returnReason: {
        type: String,
        default: null,
      },
    },
  ],
  totalPrice: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  coupon: {
    type: Schema.Types.ObjectId,
    ref: "Coupon",
  },
  finalAmount: {
    type: Number,
    required: true,
  },
  address: {
    type: Schema.Types.ObjectId,
    ref: "Address",
    required: true,
  },
  invoiceDate: {
    type: Date,
    default: Date.now(),
  },
  createdOn: {
    type: Date,
    default: Date.now,
    required: true,
  },
  offer: {
    type: Schema.Types.ObjectId,
    ref: "Offer",
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["Cash On Delivery", "Card Payment", "Wallet Payment", "Pending"],
    default: "Cash On Delivery",
  },
  transactionId: {
    type: String,
    default: null,
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ["Pending", "Completed", "Failed", "Refunded"],
  },
});

// Indexes for improved query performance
orderSchema.index({ orderId: 1 }); // Unique order lookup
orderSchema.index({ userId: 1, createdOn: -1 }); // User orders by date
orderSchema.index({ "items.itemOrderId": 1 }); // Individual item lookup
orderSchema.index({ paymentStatus: 1 }); // Payment status filtering
orderSchema.index({ "items.status": 1 }); // Order status filtering
orderSchema.index({ createdOn: -1 }); // Recent orders

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
