const express =  require('express');
const router = express.Router();
const userController =  require('../controllers/user/userController');


router.get("/pageNotFound", userController.pageNotFound);
router.get("/",userController.loadHomepage);
router.get("/login",userController.loadLoginpage);

router.get("/signup",userController.loadSignuppage);
router.post("/signup",userController.signup);
router.post("/verify-otp",userController.verifyOtp)
router.post("/resend-otp",userController.resendOtp)

router.get("/products",userController.loadProductpage)









module.exports = router;