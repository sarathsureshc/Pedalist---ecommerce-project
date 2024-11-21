const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Cart = require("../../models/cartSchema");
const Wallet = require("../../models/walletSchema");
const Coupon = require("../../models/couponSchema");
const Offer = require("../../models/offerSchema");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const env = require("dotenv").config();
const PDFDocument = require("pdfkit");
const path = require("path");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const placeOrder = async (req, res) => {
  try {
    const { address, paymentMethod, couponCode } = req.body;
    const user = req.session.user || req.user;
    console.log(req.body);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User  not authenticated." });
    }

    const cart = await Cart.findOne({ userId: user._id }).populate(
      "items.productId",
    );
    if (!cart || cart.items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Your cart is empty." });
    }

    const offers = await Offer.find({ isActive: true, isDeleted: false });
    let totalDiscount = 0;
    let subtotal = 0;
    let coupon = null;

    if (couponCode) {
      coupon = await Coupon.findOne({ couponCode });
    }

    for (const item of cart.items) {
      const product = await Product.findById(item.productId._id);
      let priceAfterOffer = product.price;
      let bestOffer = null;

      offers.forEach((offer) => {
        let isApplicable = false;

        switch (offer.offerGroup) {
          case "Brand":
            isApplicable = offer.brandsIncluded.includes(
              product.brand._id.toString(),
            );
            break;
          case "Category":
            isApplicable = offer.categoriesIncluded.includes(
              product.category._id.toString(),
            );
            break;
          case "Product":
            isApplicable = offer.productsIncluded.includes(
              product._id.toString(),
            );
            break;
        }

        if (isApplicable) {
          let effectiveDiscount = 0;

          if (offer.offerType === "Percentage") {
            effectiveDiscount = (product.price * offer.offerValue) / 100;
          } else if (offer.offerType === "Flat") {
            effectiveDiscount = offer.offerValue;
          }

          if (offer.maxDiscountAmount) {
            effectiveDiscount = Math.min(
              effectiveDiscount,
              offer.maxDiscountAmount,
            );
          }

          if (!bestOffer || effectiveDiscount > bestOffer.effectiveDiscount) {
            bestOffer = {
              offerName: offer.offerName,
              effectiveDiscount,
            };
          }
        }
      });

      if (bestOffer) {
        priceAfterOffer -= bestOffer.effectiveDiscount;
        totalDiscount += bestOffer.effectiveDiscount;
      }

      subtotal += priceAfterOffer * item.quantity;
      item.priceApplied = priceAfterOffer;
    }

    let couponDiscount = 0;
    if (coupon) {
      if (coupon.discountType === "Percentage") {
        couponDiscount = (subtotal * coupon.value) / 100;
        if (couponDiscount > coupon.maxDiscountAmount) {
          couponDiscount = coupon.maxDiscountAmount;
        }
      } else {
        couponDiscount = coupon.value;
      }
      totalDiscount += couponDiscount;
    }

    const deliveryCharge = 50;
    const totalPrice = subtotal - couponDiscount + deliveryCharge;

    const newOrder = new Order({
      userId: user._id,
      items: cart.items.map((item) => ({
        product: item.productId._id,
        quantity: item.quantity,
        priceApplied: item.priceApplied,
        status: paymentMethod === "Cash On Delivery" ? "Placed" : "Pending",
      })),
      address,
      paymentMethod:
        paymentMethod === "Cash On Delivery" ? "Cash On Delivery" : "Pending",
      totalPrice: totalPrice,
      discount: totalDiscount,
      coupon: coupon ? coupon._id : null,
      finalAmount: totalPrice,
      paymentStatus: "Pending",
    });

    await newOrder.save();

    if (paymentMethod === "Wallet Payment") {
      const userWallet = await Wallet.findOne({ userId: user._id });
      if (!userWallet || userWallet.balance < totalPrice) {
        return res.status(400).json({
          success: false,
          message: "Insufficient balance in your wallet.",
        });
      }
      newOrder.paymentMethod = "Wallet Payment";
      newOrder.paymentStatus = "Completed";
      newOrder.items = newOrder.items.map((item) => ({
        ...item,
        status: "Placed",
      }));
      await newOrder.save();

      userWallet.balance -= totalPrice;
      await userWallet.save();

      // Add transaction details to wallet
      userWallet.transaction.push({
        transactionId: newOrder._id,
        transactionType: "Debit",
        amount: totalPrice,
        reference: `Order ${newOrder._id}`,
        orderId: newOrder._id,
        description: `Order Payment ${newOrder._id}`,
      });
      await userWallet.save();
      cart.items = [];
      await cart.save();
      return res.status(201).json({
        success: true,
        orderId: newOrder._id,
        message: "Order placed successfully!",
      });
    } else if (paymentMethod === "payNow") {
      const options = {
        amount: totalPrice * 100,
        currency: "INR",
        receipt: `order_rcptid_${newOrder._id}`,
      };

      const order = await razorpay.orders.create(options);
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
          { _id: item.productId._id },
          { $inc: { quantity: -item.quantity } },
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
    const order = await Order.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY);
    hmac.update(`${razorpayOrderId}|${paymentId}`);
    const expectedSignature = hmac.digest("hex");

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
          { $inc: { quantity: -item.quantity } },
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
      res.render("payment-failed", { order });
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

    const userData = await User.findOne({ _id: user._id });

    const order = await Order.findById(orderId)
      .populate("items.product")
      .populate("address");
    // console.log("Order:", order);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    res.render("order-placed", { order, user: userData, cartCount: 0 });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).send("Internal Server Error");
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.query.id;
    const order = await Order.findById(orderId)
      .populate("items.product")
      .populate("address");

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const doc = new PDFDocument({ margin: 50 });
    let filename = `invoice-${order.orderId}.pdf`;
    res.setHeader("Content-disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-type", "application/pdf");

    doc.pipe(res);

    doc.font("C:/Windows/Fonts/Arial.ttf");

    doc.fontSize(25).text("Invoice", { align: "center" }).moveDown(1.5);
    doc.fontSize(16).text(`Order ID: ${order.orderId}`, { align: "right" });
    doc.text(`Order Date: ${order.invoiceDate.toDateString()}`, {
      align: "right",
    });
    doc.moveDown();

    doc.fontSize(18).text("Order Summary:", { underline: true }).moveDown(0.5);
    doc.fontSize(14).text(`Total Amount: ₹${order.totalPrice.toFixed(2)}`);
    doc.text(
      `Total Discount: ₹${order.discount.toFixed(
        2,
      )} (Including Offers and Coupon)`,
    );
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.moveDown(1.5);

    doc.fontSize(18).text("Items Ordered:", { underline: true }).moveDown(0.5);
    const tableTop = doc.y;
    doc.fontSize(12).text("Item", 50, tableTop, { bold: true });
    doc.text("Quantity", 200, tableTop, { bold: true });
    doc.text("Price per Item", 300, tableTop, { bold: true });
    doc.text("Subtotal", 400, tableTop, { bold: true });

    doc
      .moveTo(50, doc.y + 5)
      .lineTo(550, doc.y + 5)
      .stroke();
    doc.moveDown(1);

    order.items.forEach((item) => {
      const productName = item.product.productName;
      const quantity = item.quantity;
      const price = `₹${item.priceApplied.toFixed(2)}`;
      const subtotal = `₹${(item.priceApplied * quantity).toFixed(2)}`;

      const rowY = doc.y;
      doc.fontSize(12).text(productName, 50, rowY);
      doc.text(quantity, 200, rowY);
      doc.text(price, 300, rowY);
      doc.text(subtotal, 400, rowY);
      doc.moveDown(1);
    });

    doc.moveDown(2);
    doc
      .fontSize(18)
      .text("Delivery Address:", { underline: true })
      .moveDown(0.5);
    doc.fontSize(14).text(`Name: ${order.address.name}`);
    doc.text(
      `Address: ${order.address.houseName}, ${order.address.streetName}, ${order.address.landmark}, ${order.address.locality}, ${order.address.city}, ${order.address.state} - ${order.address.pin}`,
    );
    doc.text(`Contact No: ${order.address.contactNo}`);

    doc.end();
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).send("Internal Server Error");
  }
};

const getUserOrders = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    if (!user) {
      return res.redirect("/login");
    }
    let cartCount = 0;
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;

    const userId = user._id;
    const userData = await User.findById(userId);
    const orders = await Order.find({ userId })
      .populate("items.product")
      .populate("address")
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments({ userId });
    const totalPages = Math.ceil(totalOrders / limit);

    const cart = await Cart.findOne({ userId: user._id });

    if (cart) {
      cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    }

    res.render("view-orders", {
      orders,
      user: userData,
      cartCount,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Internal Server Error");
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    if (!user) {
      return res.redirect("/login");
    }
    let cartCount = 0;
    const cart = await Cart.findOne({ userId: user._id });

    if (cart) {
      cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    }
    const userData = await User.findById(user._id);
    const orderId = req.query.id;
    const order = await Order.findById(orderId)
      .populate("items.product")
      .populate("address");

    if (!order) {
      return res.status(404).send("Order not found");
    }

    res.render("order-detail", { order, user: userData, cartCount });
  } catch (error) {
    console.error("Error fetching order details:", error);
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
              `Refunded ₹${refundAmount} to user ${user._id}'s wallet.`,
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
          { $inc: { quantity: quantity } },
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

const continuePayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Validate orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID." });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    // Updated condition to check payment status and method
    if (
      order.paymentStatus !== "Pending" ||
      order.paymentMethod !== "Pending"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment cannot be continued for this order.",
      });
    }

    const options = {
      amount: order.totalPrice * 100, // Convert to smallest currency unit
      currency: "INR",
      receipt: `order_rcptid_${order._id}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Save Razorpay order ID to the order document
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.status(200).json({
      success: true,
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: order.totalPrice,
      currency: "INR",
      keyId: razorpay.key_id,
    });
  } catch (error) {
    console.error("Error continuing payment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

module.exports = {
  placeOrder,
  verifyRazorpayPayment,
  loadOrderPlaced,
  downloadInvoice,
  getUserOrders,
  getOrderDetails,
  cancelOrderItem,
  requestReturn,
  continuePayment,
};
