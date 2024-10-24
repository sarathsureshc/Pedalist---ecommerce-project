const express =  require('express');
const router = express.Router();
const passport = require('passport')
const userController =  require('../controllers/user/userController');
const {userAuth} = require("../middlewares/auth");
const profileController = require('../controllers/user/profileController');
const productsController = require('../controllers/user/productsController');
const cartController = require('../controllers/user/cartController');
// const wishlistController = require('../controllers/user/wishlistController');

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

router.post("/add-to-cart",userAuth,cartController.addToCart);
router.get("/cart",userAuth,cartController.getCart);
router.put('/cart/:id',userAuth,cartController.updateCart);
router.delete('/cart/:id',userAuth,cartController.removeFromCart);
// router.post("/add-to-wishlist",userAuth,wishlistController.addToWishlist)

// router.post("checkout",userAuth,checkoutController.checkout)



module.exports = router;