const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Cart = require("../../models/cartSchema");
const Wallet = require("../../models/walletSchema");
const Coupon = require("../../models/couponSchema");
const mongoose = require("mongoose");

const loadOrderPage = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const query = search
      ? { "user.firstName": { $regex: search, $options: "i" } }
      : {};

    const orders = await Order.find(query)
      .populate("userId", "firstName lastName email")
      .limit(limit)
      .skip((page - 1) * limit);

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    res.render("order-management", {
      orders,
      currentPage: Number(page),
      totalPages,
      search,
    });
  } catch (error) {
    res.status(500).send({ message: "Error fetching orders", error });
  }
};

const loadOrderDetail = async (req, res) => {
  try {
    const orderId = req.query.id;
    // console.log("Order ID:", orderId);

    const order = await Order.findById(orderId)
      .populate("userId", "firstName")
      .populate("address")
      .populate("items.product")
      .populate("coupon");

      // console.log(order.items);

    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    res.render("order-details", {
      order,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).send({ message: "Error fetching order details", error });
  }
};

const changeReturnStatus = async (req, res) => {
  try {
    const { orderId, productId, action, quantity } = req.body;
    
    const order = await Order.findById(orderId);
  
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }
  
    const item = order.items.find(item => item.product._id.toString() === productId);
  
    if (!item) {
      return res.status(404).send({ message: "Item not found" });
    }
  
    if (action === 'Approved') {
      item.status = 'Returned'; 
  
      const user = order.userId;
      let wallet = await Wallet.findOne({ userId: user });
      if (!wallet) {
        wallet = new Wallet({
          userId: user,
          balance: 0,
          card: [],
          transaction: [],
        });
        await wallet.save();
        console.log(`Created a new wallet for user ${user}.`);
      }
  
      const product = await Product.findById(item.product);
      if (!product) {
        console.error("Product not found:", item.product);
        return res.status(404).send({ message: "Product not found" });
      }
  
      const refundAmount = product.price * item.quantity;
      
      if (!isNaN(refundAmount) && refundAmount > 0) {

        wallet.balance += refundAmount;
        await wallet.save();
        console.log(`Refunded ₹${refundAmount} to user ${user}'s wallet.`);
        const description = `Refund for returned product - ${item.product.name}`;
        processRefund(user, orderId, refundAmount, description)
      } else {
        console.error("Invalid refund amount calculated:", refundAmount);
        return res.status(400).send({ message: "Invalid refund amount." });
      }
  
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
    } else if (action === 'Declined') {
      item.status = 'Delivered'; 
    }
  
    await order.save();
  
    res.send({ message: "Return status updated successfully." });
  } catch (error) {
    console.error("Error changing return status:", error);
    res.status(500).send({ message: "Error changing return status", error });
  }
};


const changeOrderStatus = async (req, res) => {
  try {
    const { orderId, productId, action } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    const item = order.items.find(item => item.product._id.toString() === productId);

    if (!item) {
      return res.status(404).send({ message: "Item not found" });
    }

    item.status = action; n

    if (action === 'Returned') {
      await Product.findByIdAndUpdate(productId, {
        $inc: { quantity: item.quantity }
      });
    }

    await order.save();

    res.send({ message: "Order status updated successfully." });
  } catch (error) {
    console.error("Error changing order status:", error);
    res.status(500).send({ message: "Error changing order status", error });
  }
};

async function processRefund(userId, orderId, amount, description) {
  try {
      const wallet = await Wallet.findOne({ userId });
      
      if (!wallet) {
          throw new Error('Wallet not found');
      }

      const transaction = {
          transactionId: new mongoose.Types.ObjectId(),
          transactionType: 'Refund',
          transactionDate: new Date(),
          reference: `Refund for Order: ${orderId}`,
          orderId: orderId,
          amount: amount,
          description: description
      };

      wallet.transaction.push(transaction);
      
      await wallet.save();
      
      console.log('Refund processed successfully.');
  } catch (error) {
      console.error('Error processing refund:', error);
  }
}


module.exports = {
  loadOrderPage,
  loadOrderDetail,
  changeOrderStatus,
  changeReturnStatus,
};
