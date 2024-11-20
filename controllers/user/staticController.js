const User = require('../../models/userSchema');
const Cart = require('../../models/cartSchema');

const getAboutUs = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        let cartCount = 0;
        let cart = null;

        if (user) {
            cart = await Cart.findOne({ userId: user._id });
        }

        if (cart) {
            cartCount = cart.items.reduce(
                (total, item) => total + item.quantity,
                0
            );
        }

        if (user) {
            res.render("about-us", { user, cartCount });
        } else {
            res.render("about-us");
        }
        
    } catch (error) {
        console.error("Error fetching about us page:", error);
        res.status(500).send("Error fetching about us page");
    }
}

const getContactUs = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        let cartCount = 0;
        let cart = null;

        if (user) {
            cart = await Cart.findOne({ userId: user._id });
        }

        if (cart) {
            cartCount = cart.items.reduce(
                (total, item) => total + item.quantity,
                0
            );
        }

        if (user) {
            res.render("contact-us", { user, cartCount });
        } else {
            res.render("contact-us");
        }
        
    } catch (error) {
        console.error("Error fetching contact us page:", error);
        res.status(500).send("Error fetching contact us page");
    }
}

module.exports = {
    getAboutUs,
    getContactUs,
}