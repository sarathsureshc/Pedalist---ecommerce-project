const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Cart = require("../../models/cartSchema");
const Razorpay = require('razorpay');
const crypto = require("crypto");
const env = require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY
});

const placeOrder = async (req, res) => {
  try {
    const { address, paymentMethod } = req.body;
    const user = req.session.user || req.user;

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated." });
    }

    const cart = await Cart.findOne({ userId: user._id }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Your cart is empty." });
    }

    const subtotal = cart.items.reduce(
      (acc, item) => acc + item.productId.price * item.quantity,
      0
    );
    const discount = 0;
    const deliveryCharge = 50;
    const totalPrice = subtotal - discount + deliveryCharge;

    console.log("Razorpay Key ID:", process.env.RAZORPAY_ID_KEY);
console.log("Razorpay Key Secret:", process.env.RAZORPAY_SECRET_KEY);


    const newOrder = new Order({
      userId: user._id,
      items: cart.items.map((item) => ({
        product: item.productId._id,
        quantity: item.quantity,
        status: "Pending",
      })),
      address,
      paymentMethod: paymentMethod === 'Cash On Delivery' ? 'Cash On Delivery' : 'Pending',
      totalPrice,
      finalAmount: totalPrice,
      paymentStatus: 'Pending'
    });

    await newOrder.save();

    if (paymentMethod === 'payNow') {
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
      return res.status(404).json({ success: false, message: "Order not found." });
    }

      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY);
      hmac.update(`${razorpayOrderId}|${paymentId}`);
      const expectedSignature = hmac.digest('hex');

      console.log("Expected signature: ", expectedSignature);

      console.log(expectedSignature === signature);

    if (expectedSignature === signature) {
      order.paymentStatus = "Completed";
      order.paymentMethod = "Card Payment";
      order.transactionId = paymentId;
      await order.save();
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { quantity: -item.quantity } }
        );
      }

      await Cart.updateOne({ userId: order.userId }, { $set: { items: [] } });
      res.json({ success: true, message: "Payment verified and order placed successfully." });
    } else {
      order.paymentStatus = "Failed";
      await order.save();
      res.status(400).json({ success: false, message: "Payment verification failed." });
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
    if (user) {
      const userId = user._id;
      const userData = await User.findById(userId);
      const orders = await Order.find({ userId })
        .populate("items.product")
        .populate("address");

      res.render("view-orders", { orders, user: userData });
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
  console.log(`cancelling order`, quantity, orderId, itemId, reason);
  const user = req.session.user || req.user;

  try {
    const order = await Order.findById(orderId);
    const item = order.items.id(itemId);
    if (user) {
      if (
        item &&
        (item.status === "Pending" ||
          item.status === "Processing" ||
          item.status === "Shipped")
      ) {
        item.status = "Cancelled";
        item.cancelReason = reason;
        await order.save();

        await Product.updateOne(
          { _id: item.product },
          { $inc: { quantity: quantity } }
        );
        res.redirect("/orders");
      } else {
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
        item.status = 'Return Request';
        item.returnReason = reason;
        await order.save();

        // await Product.updateOne(
        //   { _id: itemId },
        //   { $inc: { quantity: parseInt(quantity, 10) } }
        // );
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

module.exports = {
  placeOrder,
  verifyRazorpayPayment,
  loadOrderPlaced,
  getUserOrders,
  cancelOrderItem,
  requestReturn,
};
