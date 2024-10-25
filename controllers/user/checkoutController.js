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

        const cart = await Cart.findOne({ userId: user._id }).populate("items.productId");

        const orderItems = cart && cart.items.length > 0 ? cart.items.map(item => {
            return {
                productName: item.productId.productName,
                quantity: item.quantity,
                price: item.productId.price,
            };
        }) : [];


        const addresses = await Address.find({userId:user._id});
  
        let subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    

        const discount = 0; 
       
        const deliveryCharge = 50;
    
        const totalPrice = subtotal - discount + deliveryCharge;

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

        req.session.orderItems = [{
            productId: product._id,
            productName: product.productName,
            price: product.price,
            quantity: 1
        }];
        console.log(req.session.orderItems);
        console.log(product)

        
        res.render('buyNow', {
            product: {
                productId : product._id,
                productName: product.productName,
                price: product.price,
                quantity: 1
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while processing your request.');
    }
};


module.exports = {
    getCheckoutPage,
    buyNow
}