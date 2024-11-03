const Coupon = require('../../models/couponSchema')
const Cart = require('../../models/cartSchema');

const validateCoupon = async (req, res) => {
    try {
        const { couponCode, subtotal } = req.body;
        const user =req.session.user || req.user;

        if (!user) {
            return res.redirect('/login');
        }

        console.log(subtotal)
        
        const coupon = await Coupon.findOne({ couponCode: couponCode, isActive: true });

        
        if (!coupon) {
            return res.status(400).json({ success: false, message: "Invalid or inactive coupon code." });
        } else if (subtotal < coupon.minPurchaseAmount) {
            return res.status(400).json({
                success: false,
                message: `Coupon requires a minimum purchase of ₹${coupon.minPurchaseAmount}.`
            });
        }
        console.log(coupon.value)
        let discount = 0;

        if (coupon.discountType == 'Percentage') {
            discount = (subtotal * coupon.value) / 100;
            console.log("yes")
            if (discount > coupon.maxDiscountAmount) {
                discount = coupon.maxDiscountAmount;
            }
        } else {
            discount = coupon.value;
        }

        console.log(discount)

        res.status(200).json({ success: true, discount });
    } catch (error) {
        console.error("Error validating coupon:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};


const showCoupon = async (req, res) => {
    try {
        const coupons = await Coupon.find({ isActive: true });
        res.render('coupons', {coupons})
    } catch (error) {
        console.error("Error fetching coupons:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};


module.exports = {
    validateCoupon,
    showCoupon
}
