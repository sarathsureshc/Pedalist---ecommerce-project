const express =  require('express');
const router = express.Router();
const userController =  require('../controllers/user/userController');


router.get("/pageNotFound", userController.pageNotFound);
router.get("/",userController.loadHomepage);
router.get("/login",userController.loadLoginpage);
router.get("/signup",userController.loadSignuppage);









module.exports = router;