const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Cart = require("../../models/cartSchema");
const Wallet = require("../../models/walletSchema");
const Coupon = require("../../models/couponSchema");
const Offer = require("../../models/offerSchema")
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
    const { address, paymentMethod, couponCode } = req.body;
    const user = req.session.user || req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: "User  not authenticated." });
    }

    const cart = await Cart.findOne({ userId: user._id }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Your cart is empty." });
    }

    // Fetch all active offers
    const offers = await Offer.find({ isActive: true, isDeleted: false });

    let totalDiscount = 0; // Initialize total discount
    let subtotal = 0; // Initialize subtotal
    let coupon = null; // Initialize coupon variable

    // Check if a coupon code was provided
    if (couponCode) {
      coupon = await Coupon.findOne({ couponCode });
    }

    for (const item of cart.items) {
      const product = await Product.findById(item.productId._id);
      let priceAfterOffer = product.price; // Start with the original price
      let bestOffer = null;

      // Check applicable offers
      offers.forEach(offer => {
        let isApplicable = false;

        // Determine if the offer is applicable based on the offerGroup
        switch (offer.offerGroup) {
          case 'Brand':
            isApplicable = offer.brandsIncluded.includes(product.brand._id.toString());
            break;
          case 'Category':
            isApplicable = offer.categoriesIncluded.includes(product.category._id.toString());
            break;
          case 'Product':
            isApplicable = offer.productsIncluded.includes(product._id.toString());
            break;
        }

        // If the offer is applicable, calculate the effective discount
        if (isApplicable) {
          let effectiveDiscount = 0;

          if (offer.offerType === 'Percentage') {
            effectiveDiscount = (product.price * offer.offerValue) / 100;
          } else if (offer.offerType === 'Flat') {
            effectiveDiscount = offer.offerValue;
          }

          // Ensure the effective discount does not exceed the max discount amount
          if (offer.maxDiscountAmount) {
            effectiveDiscount = Math.min(effectiveDiscount, offer.maxDiscountAmount);
          }

          // Determine if this is the best offer
          if (!bestOffer || effectiveDiscount > bestOffer.effectiveDiscount) {
            bestOffer = {
              offerName: offer.offerName,
              effectiveDiscount,
            };
          }
        }
      });

      // Apply the best offer to the product price
      if (bestOffer) {
        priceAfterOffer -= bestOffer.effectiveDiscount;
        totalDiscount += bestOffer.effectiveDiscount; // Add to total discount
      }

      // Calculate subtotal with the price after applying the offer
      subtotal += priceAfterOffer * item.quantity; // Calculate subtotal
      item.priceApplied = priceAfterOffer; // Save the price after applying the offer
    }

    // Log subtotal for debugging
    console.log("Subtotal:", subtotal);

    // Add coupon discount if applicable
    let couponDiscount = 0;
    if (coupon) {
      if (coupon.discountType === 'Percentage') {
            couponDiscount = (subtotal * coupon.value) / 100;
            if (couponDiscount > coupon.maxDiscountAmount) {
                couponDiscount = coupon.maxDiscountAmount;
            }
        } else {
            couponDiscount = coupon.value;
        }
      totalDiscount += couponDiscount; // Add coupon discount to total discount
      console.log("Coupon Discount:", couponDiscount); // Log coupon discount for debugging
    }

    // Log total discount for debugging
    console.log("Total Discount (including coupon):", totalDiscount);

    // Calculate final total price
    const deliveryCharge = 50;
    const totalPrice = subtotal - couponDiscount + deliveryCharge;

    // Log total price for debugging
    console.log("Total Price (after discounts and delivery charge):", totalPrice);

    // Ensure totalPrice is a number
    if (isNaN(totalPrice)) {
      throw new Error("Total price calculation resulted in NaN");
    }

    const newOrder = new Order({
      userId: user._id,
      items: cart.items.map((item) => ({
        product: item.productId._id,
        quantity: item.quantity,
        priceApplied: item.priceApplied, // Save the price applied
        status: paymentMethod === "Cash On Delivery" ? "Placed" : "Pending",
      })),
      address,
      paymentMethod: paymentMethod === "Cash On Delivery" ? "Cash On Delivery" : "Pending",
      totalPrice: totalPrice, // Ensure this is a valid number
      discount: totalDiscount, // Ensure this is a valid number
      coupon: coupon ? coupon._id : null, // Save coupon ID if applicable
      finalAmount: totalPrice, // Ensure this is a valid number
      paymentStatus: "Pending",
    });

    await newOrder.save();

    if (paymentMethod === "payNow") {
      const options = {
        amount: totalPrice * 100, // Convert to smallest currency unit
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
    const page = parseInt(req.query.page) || 1; // Get the current page from query params
    const limit = 3; // Number of orders per page
    const skip = (page - 1) * limit; // Calculate how many orders to skip

    if (user) {
      const userId = user._id;
      const userData = await User.findById(userId);
      const orders = await Order.find({ userId })
        .populate("items.product")
        .populate("address")
        .sort({ invoiceDate: -1 }) // Sort by invoice date descending
        .skip(skip)
        .limit(limit);

      const totalOrders = await Order.countDocuments({ userId }); // Get total number of orders
      const totalPages = Math.ceil(totalOrders / limit); // Calculate total pages

      const cart = await Cart.findOne({ userId: user._id });

      if (cart) {
        cartCount = cart.items.reduce(
          (total, item) => total + item.quantity,
          0
        );
      }

      res.render("view-orders", { orders, user: userData, cartCount, page, totalPages });
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
