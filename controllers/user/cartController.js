const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const Cart = require("../../models/cartSchema");

const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        // Input Validation
        if (!productId || !quantity || quantity < 1) {
            return res.status(400).json({ success: false, message: "Invalid product ID or quantity." });
        }

        // Fetch Product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        // Get User Info from Session or Auth Middleware
        const user = req.session.user || req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: "User not authenticated." });
        }

        // Retrieve or Create User's Cart
        let cart = await Cart.findOne({ userId: user._id });
        if (!cart) {
            cart = new Cart({
                userId: user._id,
                items: [{ productId, quantity }]
            });
        } else {
            // Update Cart: Find if Product Already Exists
            const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
            if (existingItemIndex >= 0) {
                cart.items[existingItemIndex].quantity += quantity;
            } else {
                cart.items.push({ productId, quantity });
            }
        }

        // Save Cart to Database
        await cart.save();

        res.status(200).json({ success: true, message: "Product added to cart successfully." });
    } catch (error) {
        console.error("Error adding product to cart:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};

const getCart = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        if (!user) {
            return res.redirect('/login')
        }

        const cart = await Cart.findOne({ userId: user._id }).populate('items.productId');
        if (!cart) {
            return res.status(404).render('cart', { cart: [], totalPrice: 0, offer: "No offer" });
        }

        // Calculate total price
        let totalPrice = 0;
        const offer = "No offer"; // Example offer placeholder
        cart.items.forEach(item => {
            totalPrice += item.productId.price * item.quantity;
        });
        
        // Fetch User Info
            const userData = await User.findOne({ _id: user._id });

            res.render('cart', {
                user: userData,
                cart: cart.items,
                totalPrice,
                offer
            });
       
        
        
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};



const updateCart = async (req, res) => {
    const { quantity } = req.body;

    if (quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be at least 1.' });
    }

    try {
        const user = req.session.user || req.user;
        if(user){
        const userData = await User.findOne({ _id: user._id });
       
    
        console.log(`Updating cart for user ${userData._id} with product ID: ${req.params.id} to quantity: ${quantity}`);
        
        const cart = await Cart.findOneAndUpdate(
            { userId: userData._id, "items.productId": req.params.id },
            { $set: { "items.$.quantity": quantity } },
            { new: true }
        );

        if (!cart) {
            return res.status(404).json({ message: 'Cart item not found.' });
        }

        res.status(200).json({ success: true, cart });
    }else{
        res.redirect('/login');
    }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.' });
    }
};



const removeFromCart = async (req, res) => {
    try {

        const user = req.session.user || req.user;
        
        if(user){
            const userData = await User.findOne({ _id: user._id });
           

        const cart = await Cart.findOneAndUpdate(
            { userId: userData._id },
            { $pull: { items: { productId: req.params.id } } },
            { new: true }
        );

        if (!cart) {
            return res.status(404).json({ message: 'Cart item not found.' });
        }

        res.status(200).json({ message: 'Item removed from cart successfully.', cart });

    }else{
        res.redirect('/login');
    }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.' });
    }
};


module.exports ={
    addToCart,
    getCart,
    updateCart,
    removeFromCart,
}