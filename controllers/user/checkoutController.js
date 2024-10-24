const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');
const Address = require('../../models/addressSchema');
const Order = require('../../models/orderSchema');
const Cart = require('../../models/cartSchema');

const getCheckoutPage = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        if (!user) {
            return res.redirect("/login");
        }

        const userData = await User.findById(user);

        // Fetch User's Cart
        const cart = await Cart.findOne({ userId: user._id }).populate("items.productId");
        console.log("Cart:", cart);

        // Check if the cart is empty
        const orderItems = cart && cart.items.length > 0 ? cart.items.map(item => {
            return {
                productName: item.productId.productName,
                quantity: item.quantity,
                price: item.productId.price,
            };
        }) : [];

        // Fetch User's Addresses
        const addresses = await Address.find({userId:user._id});
        console.log("User Addresses:", addresses);

        // Calculate Order Summary
        let subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        console.log("Order Items:", orderItems);

        const discount = 0; // Calculate discount if applicable
        const deliveryCharge = 50; // Example delivery charge
        const totalPrice = subtotal - discount + deliveryCharge;

        // Render Checkout Page with Data
        res.render("checkout", {
            addresses,
            orderItems,
            subtotal,
            discount,
            deliveryCharge,
            totalPrice,
            user : userData
        });
    } catch (error) {
        console.error("Error displaying checkout page:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};
 
  



const buyNow = async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).send('Product not found.');
        }

        // Add product to session as order item
        req.session.orderItems = [{
            productName: product.productName,
            price: product.price,
            quantity: 1
        }];

        res.redirect('/checkout');
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while processing your request.');
    }
};

const placeOrder = async (req, res) => {
    try {
        const { address, paymentMethod } = req.body;

        const user = req.session.user || req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: "User not authenticated." });
        }

        // Fetch the cart for the user
        const cart = await Cart.findOne({ userId: user._id });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Your cart is empty." });
        }

        // Create a new order
        const newOrder = new Order({
            userId: user._id,
            items: cart.items,
            address,
            paymentMethod,
            status: 'Pending',
            totalPrice: cart.totalPrice, // Assume you calculate totalPrice in the Cart model
        });

        await newOrder.save();

        // Optionally, you can clear the user's cart after placing the order
        cart.items = [];
        await cart.save();

        res.status(201).json({ success: true, message: "Order placed successfully!" });
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};

// const payNow = async (req, res) => {
//     try {
//         const addressId = req.query.address;
//         // Handle payment logic here
//         res.send('Payment successful.');
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('An error occurred during payment.');
//     }
// };

// const cashOnDelivery = async (req, res) => {
//     try {
//         const addressId = req.query.address;
//         // Handle order creation and "Cash on Delivery" logic here
//         res.send('Order placed successfully. Cash on delivery selected.');
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('An error occurred while placing the order.');
//     }
// };
module.exports = {
    getCheckoutPage,
    buyNow,
    placeOrder,
    // payNow,
    // cashOnDelivery,
}