const express =  require('express');
const router = express.Router();
const passport = require('passport')
const userController =  require('../controllers/user/userController');
const {userAuth} = require("../middlewares/auth");
const profileController = require('../controllers/user/profileController');
const productsController = require('../controllers/user/productsController');
const cartController = require('../controllers/user/cartController');
const addressController = require('../controllers/user/addressController');
const checkoutController = require('../controllers/user/checkoutController');
const orderController = require('../controllers/user/orderController');
const wishlistController = require('../controllers/user/wishlistController');
const walletController = require('../controllers/user/walletController');
const couponController = require('../controllers/user/couponController');

router.get("/pageNotFound", userController.pageNotFound);
router.get("/",userAuth,userController.loadHomepage);

router.get("/signup",userController.loadSignuppage);
router.post("/signup",userController.signup);
router.post("/verify-otp",userController.verifyOtp)
router.post("/resend-otp",userController.resendOtp)

router.get("/auth/google",passport.authenticate('google',{scope:['profile','email']}));

router.get("/auth/google/callback",passport.authenticate('google',{failureRedirect:'/login', failureFlash: true}),(req,res)=>{
    res.redirect('/');
})

router.get("/login",userController.loadLoginpage);
router.post("/login",userController.login);
// router.get("/forgot-password",userController.loadForgotPassword);
// router.post("/forgot-password",userController.forgotPassword);
router.get("/logout",userController.logout);

router.get("/products",userAuth,productsController.loadProductPage);
router.get("/product-detail",userAuth,productsController.loadProductDetailPage);


router.get("/profile",userAuth,profileController.loadProfilePage);
router.get("/edit-profile",userAuth,profileController.loadProfileEditPage);
router.post("/edit-profile",userAuth,profileController.profileEdit);
router.get("/edit-password",userAuth,profileController.loadPasswordChangePage);
router.post("/edit-password",userAuth,profileController.passwordChange)

router.get('/address', userAuth, addressController.loadAddressPage);
router.get('/add-address', userAuth, addressController.loadAddAddressPage);
router.post('/add-address', userAuth, addressController.addAddress);
router.get('/edit-address', userAuth, addressController.editAddress);
router.post('/edit-address/:id', userAuth, addressController.updateAddress);
router.get('/remove-address/:id', userAuth, addressController.removeAddress);

router.get('/orders', userAuth, orderController.getUserOrders);
router.post('/cancel-order',userAuth, orderController.cancelOrderItem);
router.post('/return-order',userAuth, orderController.requestReturn)

router.post("/add-to-cart",userAuth,cartController.addToCart);
router.get("/cart",userAuth,cartController.getCart);
router.put('/cart/:id',userAuth,cartController.updateCart);
router.delete('/cart/:id',userAuth,cartController.removeFromCart);

router.post("/add-to-wishlist",userAuth,wishlistController.addToWishlist)
router.get("/wishlist",userAuth,wishlistController.loadWishlist);
router.delete("/wishlist/:id",userAuth,wishlistController.removeFromWishlist);
router.post("/move-to-cart",userAuth,wishlistController.moveToCart);

router.get('/checkout',userAuth,checkoutController.getCheckoutPage);

router.post('/place-order',userAuth, orderController.placeOrder);
router.get('/order-placed',userAuth, orderController.loadOrderPlaced);
router.get("/invoice",userAuth, orderController.downloadInvoice);
router.post('/verify-payment',userAuth, orderController.verifyRazorpayPayment);
router.post('/continue-payment',userAuth, orderController.continuePayment);

router.get('/wallet',userAuth, walletController.getWallet);

router.get('/coupons',userAuth, couponController.showCoupon);
router.post('/validate-coupon', userAuth, couponController.validateCoupon);




module.exports = router;