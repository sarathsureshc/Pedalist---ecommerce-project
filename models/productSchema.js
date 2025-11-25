const Mongoose = require("mongoose");
const { Schema } = Mongoose;

const productSchema = new Schema({
  productName: {
    type: String,
    required: true,
  },
  image: {
    type: [String],
    required: true,
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: "Brand",
    required: true,
  },
  specification1: {
    type: String,
    required: true,
  },
  specification2: {
    type: String,
    required: true,
  },
  specification3: {
    type: String,
    required: true,
  },
  specification4: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  // discountedPrice : {
  //     type: Number,
  //     default: 0,
  //     required: true
  // },
  quantity: {
    type: Number,
    required: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  isListed: {
    type: Boolean,
    default: true,
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    required: true,
  },
  createdOn: {
    type: Date,
    default: Date.now,
    required: true,
  },
  status: {
    type: String,
    enum: ["Available", "Out of Stock", "Discontinued"],
    required: true,
    default: "Available",
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
});

// Indexes for improved query performance
productSchema.index({ productName: "text", description: "text" }); // Text search
productSchema.index({ category: 1, isListed: 1 }); // Category filtering
productSchema.index({ brand: 1 }); // Brand filtering
productSchema.index({ price: 1 }); // Price sorting/filtering
productSchema.index({ rating: -1 }); // Rating sorting
productSchema.index({ createdOn: -1 }); // Recent products
productSchema.index({ isDeleted: 1 }); // Soft delete filtering

const Product = Mongoose.model("Product", productSchema);

module.exports = Product;
