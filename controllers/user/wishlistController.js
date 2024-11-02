const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');
const Offer = require('../../models/offerSchema');
const Wishlist = require('../../models/wishlistSchema');
const Cart = require('../../models/cartSchema');

const addToWishlist = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        if(!user){
            return res.redirect('/login');
        }
        const userId =user._id; 
        const { productId } = req.body;

       
        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = new Wishlist({ userId, products: [{ productId }] });
        } else {
            const isProductInWishlist = wishlist.products.some(item => item.productId.toString() === productId);

            if (isProductInWishlist) {
                return res.status(400).json({ success: false, message: 'Product is already in the wishlist.' });
            }

            wishlist.products.push({ productId });
        }

        await wishlist.save();
        res.json({ success: true, message: 'Product added to wishlist successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An error occurred while adding to wishlist.' });
    }
};

const loadWishlist = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        if(!user){
            return res.redirect('/login');  
        }

        const userId =user._id;

        const wishlist = await Wishlist.findOne({ userId }).populate({
            path: 'products.productId',
            model: 'Product',
            select: 'productName price image brand category'
        });
        

        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist not found.' });
        }

        const cart = await Cart.findOne({ userId: user._id });
      
      if (cart) {
        cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
      }

        res.render('wishlist',{wishlist: wishlist.products,user: user,cartCount});
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An error occurred while fetching the wishlist.' });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const user = req.session.user || req.user;

        if (!user) {
            return res.redirect('/login');
        }

        const userId = user._id;
        const productId = req.params.id; // Use req.params.id instead of req.body

        const wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist not found.' });
        }

        // Filter out the product with the matching productId
        wishlist.products = wishlist.products.filter(item => item.productId.toString() !== productId.toString());

        await wishlist.save();

        res.json({ success: true, message: 'Product removed from wishlist successfully!' });
    } catch (error) {
        console.error("Error in removeFromWishlist:", error);
        res.status(500).json({ success: false, message: 'An error occurred while removing from wishlist.' });
    }
};


module.exports = {
    addToWishlist,
    loadWishlist,
    removeFromWishlist,
};