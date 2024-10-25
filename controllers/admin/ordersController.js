const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Cart = require("../../models/cartSchema");

const loadOrderPage = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    // Define the query for finding orders based on user first name
    const query = search
      ? { "user.firstName": { $regex: search, $options: "i" } }
      : {}; // Case-insensitive search

    // Fetch orders based on the query and populate user details
    const orders = await Order.find(query)
      .populate("userId", "firstName lastName email") // Populate user details
      .limit(limit)
      .skip((page - 1) * limit);

    // Count total orders based on the query
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

// Get order details
const loadOrderDetail = async (req, res) => {
  try {
    const orderId = req.query.id; // Get the order ID from URL parameters
    console.log("Order ID:", orderId); // Log the order ID for debugging

    const order = await Order.findById(orderId)
      .populate("userId", "firstName")
      .populate("address")
      .populate("items.product");

      console.log(order.items);

    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    res.render("order-details", {
      order, // Pass the order object to the view
    });
  } catch (error) {
    console.error("Error fetching order details:", error); // Log the error for debugging
    res.status(500).send({ message: "Error fetching order details", error });
  }
};

// Change order status
const changeReturnStatus = async (req, res) => {
    try {
      const { orderId, productId, action } = req.body; // Expect orderId, productId, and action (Approved or Declined)
      
      // Find the order and update the item status
      const order = await Order.findById(orderId);
  
      if (!order) {
        return res.status(404).send({ message: "Order not found" });
      }
  
      const item = order.items.find(item => item.product._id.toString() === productId);
  
      if (!item) {
        return res.status(404).send({ message: "Item not found" });
      }
  
      // Handle action based on approve or decline
      if (action === 'Approved') {
        item.status = 'Returned'; // Update item status to 'Returned'
  
        // Find the product and increase the quantity
        await Product.findByIdAndUpdate(productId, {
          $inc: { quantity: item.quantity }
        });
      } else if (action === 'Declined') {
        item.status = 'Delivered'; // Update item status to 'Delivered'
      }
  
      await order.save(); // Save the order
  
      res.send({ message: "Return status updated successfully." });
    } catch (error) {
      console.error("Error changing return status:", error);
      res.status(500).send({ message: "Error changing return status", error });
    }
  };

module.exports = {
  loadOrderPage,
  loadOrderDetail,
  changeReturnStatus,
};
