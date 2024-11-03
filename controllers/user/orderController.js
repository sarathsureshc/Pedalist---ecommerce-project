const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Cart = require("../../models/cartSchema");
const Wallet = require("../../models/walletSchema");
const Coupon = require("../../models/couponSchema");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const env = require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const placeOrder = async (req, res) => {
  try {
    const { address, paymentMethod, discount, couponCode } = req.body;
    const user = req.session.user || req.user;

    console.log(couponCode);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated." });
    }

    const cart = await Cart.findOne({ userId: user._id }).populate(
      "items.productId"
    );
    if (!cart || cart.items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Your cart is empty." });
    }

    const coupon = await Coupon.findOne({ couponCode });

    for (const item of cart.items) {
      if (item.productId.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${item.productId.name}. Only ${item.productId.quantity} left in stock.`,
        });
      }
    }

    const subtotal = cart.items.reduce(
      (acc, item) => acc + item.productId.price * item.quantity,
      0
    );

    if (!discount) discount = 0;

    const deliveryCharge = 50;
    const totalPrice = subtotal - discount + deliveryCharge;

    console.log("Razorpay Key ID:", process.env.RAZORPAY_ID_KEY);
    console.log("Razorpay Key Secret:", process.env.RAZORPAY_SECRET_KEY);

    const newOrder = new Order({
      userId: user._id,
      items: cart.items.map((item) => ({
        product: item.productId._id,
        quantity: item.quantity,
        status: paymentMethod === "Cash On Delivery" ? "Placed" : "Pending",
      })),
      address,
      paymentMethod:
        paymentMethod === "Cash On Delivery" ? "Cash On Delivery" : "Pending",
      totalPrice,
      discount,
      coupon,
      finalAmount: totalPrice,
      paymentStatus: "Pending",
    });

    await newOrder.save();

    if (paymentMethod === "payNow") {
      const options = {
        amount: totalPrice * 100,
        currency: "INR",
        receipt: `order_rcptid_${newOrder._id}`,
      };

      const order = await razorpay.orders.create(options);
      console.log(order);

      return res.status(201).json({
        success: true,
        orderId: newOrder._id,
        razorpayOrderId: order.id,
        amount: totalPrice,
        currency: "INR",
        keyId: razorpay.key_id,
      });
    } else {
      for (const item of cart.items) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { quantity: -item.quantity } }
        );
      }

      cart.items = [];
      await cart.save();
      return res.status(201).json({
        success: true,
        orderId: newOrder._id,
        message: "Order placed successfully!",
      });
    }
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpayOrderId, orderId, paymentId, signature } = req.body;
    console.log(req.body);
    const order = await Order.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY);
    hmac.update(`${razorpayOrderId}|${paymentId}`);
    const expectedSignature = hmac.digest("hex");

    console.log("Expected signature: ", expectedSignature);

    console.log(expectedSignature === signature);

    if (expectedSignature === signature) {
      order.paymentStatus = "Completed";
      order.paymentMethod = "Card Payment";
      order.transactionId = paymentId;
      order.items.forEach((item) => {
        item.status = "Placed";
      });
      await order.save();
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { quantity: -item.quantity } }
        );
      }

      await Cart.updateOne({ userId: order.userId }, { $set: { items: [] } });
      res.json({
        success: true,
        message: "Payment verified and order placed successfully.",
      });
    } else {
      order.paymentStatus = "Failed";
      await order.save();
      res
        .status(400)
        .json({ success: false, message: "Payment verification failed." });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const loadOrderPlaced = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    const orderId = req.query.id;
    if (!user) {
      return res.redirect("/login");
    }

    const order = await Order.findById(orderId)
      .populate("items.product")
      .populate("address");
    console.log("Order:", order);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    res.render("order-placed", { order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).send("Internal Server Error");
  }
};

const getUserOrders = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    let cartCount = 0;
    if (user) {
      const userId = user._id;
      const userData = await User.findById(userId);
      const orders = await Order.find({ userId })
        .populate("items.product")
        .populate("address");

      const cart = await Cart.findOne({ userId: user._id });

      if (cart) {
        cartCount = cart.items.reduce(
          (total, item) => total + item.quantity,
          0
        );
      }

      res.render("view-orders", { orders, user: userData, cartCount });
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Internal Server Error");
  }
};

const cancelOrderItem = async (req, res) => {
  const { orderId, itemId, reason, quantity } = req.body;
  // console.log(`cancelling order`, quantity, orderId, itemId, reason);
  const user = req.session.user || req.user;
  if (!user) {
    return res.redirect("/login");
  }
  userId = user._id;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      req.flash("message", "Order not found.");
      return res.redirect("/orders");
    }

    const item = order.items.id(itemId);

    if (user) {
      if (
        item &&
        (item.status === "Pending" ||
          item.status === "Placed" ||
          item.status === "Processing" ||
          item.status === "Shipped")
      ) {
        item.status = "Cancelled";
        item.cancelReason = reason;
        console.log(item);

        if (order.paymentStatus === "Completed") {
          let wallet = await Wallet.findOne({ userId });
          if (!wallet) {
            wallet = new Wallet({
              userId: user._id,
              balance: 0,
              card: [],
              transaction: [],
            });
            await wallet.save();
            console.log(`Created a new wallet for user ${user._id}.`);
          }

          const product = await Product.findById(item.product);
          if (!product) {
            console.error("Product not found:", item.product);
            req.flash("message", "Product not found.");
            return res.redirect("/orders");
          }

          const refundAmount = product.price * quantity;

          if (!isNaN(refundAmount) && refundAmount > 0) {
            wallet.balance += refundAmount;
            await wallet.save();
            const description = `Refunded ${refundAmount} due to cancellation of ${product.productName}`;
            processRefund(userId, orderId, refundAmount, description);
            console.log(
              `Refunded ₹${refundAmount} to user ${user._id}'s wallet.`
            );
          } else {
            console.error("Invalid refund amount calculated:", refundAmount);
            req.flash("message", "Invalid refund amount.");
            return res.redirect("/orders");
          }
        }

        await order.save();

        await Product.updateOne(
          { _id: item.product },
          { $inc: { quantity: quantity } }
        );
        res.redirect("/orders");
      } else {
        req.flash("message", "Cannot cancel this item.");
        res.redirect("/orders");
      }
    } else {
      req.flash("message", "User not authenticated.");
      res.redirect("/login");
    }
  } catch (error) {
    console.error("Error cancelling order item:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const requestReturn = async (req, res) => {
  const user = req.session.user || req.user;

  try {
    if (user) {
      const { orderId, itemId, reason, quantity } = req.body;

      const order = await Order.findById(orderId);
      const item = order.items.id(itemId);

      if (item && item.status === "Delivered") {
        item.status = "Return Request";
        item.returnReason = reason;
        await order.save();

        res.redirect("/orders");
      } else {
        res.redirect("/orders");
      }
    } else {
      res.redirect("/orders");
    }
  } catch (error) {
    console.error("Error requesting return:", error);
    res.status(500).send("Internal Server Error");
  }
};

async function processRefund(userId, orderId, amount, description) {
  try {
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const transaction = {
      transactionId: new mongoose.Types.ObjectId(),
      transactionType: "Refund",
      transactionDate: new Date(),
      reference: `Refund for Order: ${orderId}`,
      orderId: orderId,
      amount: amount,
      description: description,
    };

    wallet.transaction.push(transaction);

    await wallet.save();

    console.log("Refund processed successfully.");
  } catch (error) {
    console.error("Error processing refund:", error);
  }
}

module.exports = {
  placeOrder,
  verifyRazorpayPayment,
  loadOrderPlaced,
  getUserOrders,
  cancelOrderItem,
  requestReturn,
};
