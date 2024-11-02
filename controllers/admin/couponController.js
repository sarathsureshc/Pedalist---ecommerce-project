const Coupon = require("../../models/couponSchema")

const getCouponsPage = async (req, res) => {
    try {
        const searchQuery = req.query.search || '';
        const currentPage = parseInt(req.query.page) || 1;
        const itemsPerPage = 4;
        
        const coupons = await Coupon.find({
            couponCode: { $regex: searchQuery, $options: 'i' }
        })
        .skip((currentPage - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .exec();

        const totalCoupons = await Coupon.countDocuments({ couponCode: { $regex: searchQuery, $options: 'i' } });
        const totalPages = Math.ceil(totalCoupons / itemsPerPage);
        res.render('coupon-management', { coupons, currentPage, totalPages, search: searchQuery });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const getAddCouponPage = async (req, res) => {
    try {
        res.render('add-coupon');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}


const addCoupon = async (req, res) => {
    try {
        const { couponCode, discountDescription, value, startDate, endDate, minPurchaseAmount, maxDiscountAmount, discountType } = req.body;
        const newCoupon = new Coupon({
            couponCode,
            discountDescription,
            value,
            startDate,
            endDate,
            minPurchaseAmount,
            maxDiscountAmount,
            discountType
        });
        await newCoupon.save();
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


const getEditCouponPage = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.query.id);
        res.render('edit-coupon', { coupon });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


const updateCoupon = async (req, res) => {
    try {
        const { couponCode, discountDescription, value, startDate, endDate, minPurchaseAmount, maxDiscountAmount, discountType } = req.body;
        await Coupon.findByIdAndUpdate(req.params.id, {
            couponCode,
            discountDescription,
            value,
            startDate,
            endDate,
            minPurchaseAmount,
            maxDiscountAmount,
            discountType
        });
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


const activateCoupon = async (req, res) => {
    try {
        await Coupon.findByIdAndUpdate(req.query.id, { isActive: true });
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


const deactivateCoupon = async (req, res) => {
    try {
        await Coupon.findByIdAndUpdate(req.query.id, { isActive: false });
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const deleteCoupon = async (req, res) => {
    try {
        await Coupon.findByIdAndUpdate(req.query.id, { isDeleted: true , isActive: false});
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


const restoreCoupon = async (req, res) => {
    try {
        await Coupon.findByIdAndUpdate(req.query.id, { isDeleted: false });
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getCouponsPage,
    getAddCouponPage,
    addCoupon,
    getEditCouponPage,
    updateCoupon,
    activateCoupon,
    deactivateCoupon,
    deleteCoupon,
    restoreCoupon,
}