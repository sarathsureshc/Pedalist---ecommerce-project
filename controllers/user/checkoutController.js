const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');
const Address = require('../../models/addressSchema');
const Order = require('../../models/orderSchema');
const Cart = require('../../models/cartSchema');
const Coupon = require('../../models/couponSchema');
const Offer = require('../../models/offerSchema');

const calculateDiscountedPrice = (product, offers) => {
    let bestOffer = null;

    offers.forEach(offer => {
        let isApplicable = false;

        // Check if the offer is applicable based on the offerGroup
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
            case 'Global':
                isApplicable = true; // Global offers apply to all products
                break;
        }

        // If applicable, calculate the effective discount
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
                    effectiveDiscount,
                    offerName: offer.offerName,
                };
            }
        }
    });

    // Return the discounted price
    return bestOffer ? product.price - bestOffer.effectiveDiscount : product.price;
};

const getCheckoutPage = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        if (!user) {
            return res.redirect("/login");
        }

        const cart = await Cart.findOne({ userId: user._id }).populate("items.productId");
        if (!cart) {
            return res.status(404).render("checkout", { orderItems: [], totalPrice: 0, discount: 0, addresses: [], deliveryCharge: 50, coupons: [] });
        }

        // Fetch all active offers
        const offers = await Offer.find({ isActive: true, isDeleted: false });

        // Fetch available coupons
        const coupons = await Coupon.find({ isActive: true, isDeleted: false });

        let subtotal = 0;
        const orderItems = cart.items.map(item => {
            const product = item.productId;
            const discountedPrice = calculateDiscountedPrice(product, offers);
            const itemSubtotal = discountedPrice * item.quantity;
            subtotal += itemSubtotal;

            return {
                productName: product.productName,
                price: discountedPrice,
                quantity: item.quantity,
                subtotal: itemSubtotal,
            };
        });

        // Calculate global discount
        const globalOffers = offers.filter(offer => offer.offerGroup === 'Global');
        let totalDiscount = 0;
        globalOffers.forEach(offer => {
            if (subtotal >= (offer.minPurchaseAmount || 0)) {
                totalDiscount += (offer.offerType === 'Percentage') ? (subtotal * offer.offerValue / 100) : offer.offerValue;
            }
        });

        const deliveryCharge = 50;
        const totalPrice = subtotal - totalDiscount + deliveryCharge;

        const addresses = await Address.find({ userId: user._id }); // Assuming you have an Address model

        res.render("checkout", {
            orderItems,
            subtotal,
            discount: totalDiscount,
            totalPrice,
            deliveryCharge,
            addresses,
            coupons, // Pass the coupons to the EJS template
        });
    } catch (error) {
        console.error("Error fetching checkout page:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};
 

module.exports = {
    getCheckoutPage,
}