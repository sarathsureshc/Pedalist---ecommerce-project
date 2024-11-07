const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');
const Address = require('../../models/addressSchema');
const Order = require('../../models/orderSchema');
const Cart = require('../../models/cartSchema');
const Coupon = require('../../models/couponSchema');

const getCheckoutPage = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        let cartCount = 0;
        if (!user) {
            return res.redirect("/login");
        }

        const userData = await User.findById(user);

        const cart = await Cart.findOne({ userId: user._id }).populate("items.productId");
        cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);

        const orderItems = cart && cart.items.length > 0 ? cart.items.map(item => {
            if(item.quantity > 5){
                return res.send({message : "Max quantity for each product is 5"});
            }
            return {
                productName: item.productId.productName,
                quantity: item.quantity,
                price: item.productId.price,
            };
        }) : [];

        const addresses = await Address.find({userId: user._id});
  
        let subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        let discount = 0; 
        const deliveryCharge = 50;
        const totalPrice = subtotal - discount + deliveryCharge;

        let coupons = await Coupon.find({isActive: true, minPurchaseAmount: { $lte: subtotal }});

        res.render("checkout", {
            addresses,
            orderItems,
            subtotal,
            discount,
            deliveryCharge,
            totalPrice,
            user: userData,
            coupons,
            cartCount,
        });
    } catch (error) {
        console.error("Error displaying checkout page:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};
 

module.exports = {
    getCheckoutPage,
}