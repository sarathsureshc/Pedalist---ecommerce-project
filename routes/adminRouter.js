const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController");
const brandController = require("../controllers/admin/brandController");
const productController = require("../controllers/admin/productController");
const ordersController = require("../controllers/admin/ordersController");
const offersController = require("../controllers/admin/offerController");
const couponController = require("../controllers/admin/couponController")
const {userAuth,adminAuth} = require("../middlewares/auth");
const multer = require('multer');
const storage = require("../helpers/multer");
const uploads = multer({storage:storage});

router.get("/pageerror",adminController.pageerror);

router.get("/login",adminController.loadLogin);
router.post("/login",adminController.login);
router.get("/",adminAuth,adminController.loadDashboard)
router.get("/logout",adminController.logout)

router.get("/users",adminAuth,customerController.customerInfo);
router.post("/blockCustomer", adminAuth,customerController.customerBlocked);
router.post("/unblockCustomer", adminAuth,customerController.customerUnBlocked);

router.get("/category",adminAuth,categoryController.categoryInfo);
router.post("/add-category",adminAuth,categoryController.addCategory);
router.get("/list-category",adminAuth,categoryController.getListCategory);
router.get("/unlist-category",adminAuth,categoryController.getUnlistCategory);
router.get("/edit-category",adminAuth,categoryController.getEditCategory);
router.post("/edit-category/:id",adminAuth,categoryController.editCategory);
router.post('/delete-category',adminAuth,categoryController.deleteCategory);
router.post('/restore-category',adminAuth,categoryController.restoreCategory);

router.get('/brands',adminAuth,brandController.getBrandPage);
router.post("/add-brand",adminAuth,uploads.single("image"),brandController.addBrand);
router.get("/unblock-brand",adminAuth,brandController.getUnblockBrand);
router.get("/block-brand",adminAuth,brandController.getBlockBrand);
router.get("/edit-brand",adminAuth,brandController.getEditBrand);
router.post("/edit-brand/:id",adminAuth,uploads.single('image'),brandController.editBrand);
router.post('/delete-brand',adminAuth,brandController.deleteBrand);
router.post('/restore-brand',adminAuth,brandController.restoreBrand);

router.get("/products",adminAuth,productController.getProductPage)
router.get("/add-product",adminAuth, productController.getProductAddPage);
router.post("/add-product",adminAuth,uploads.array("images",4), productController.addProducts);
router.get("/list-product",adminAuth,productController.getListProduct);
router.get("/unlist-product",adminAuth,productController.getUnlistProduct);
router.get("/edit-product",adminAuth,productController.getEditProduct);
router.post("/edit-product/:id",adminAuth,uploads.array("images",4), productController.editProduct);
router.post("/delete-image",adminAuth,productController.deleteSingleImage);
router.post('/deleteProduct',adminAuth,productController.deleteProduct);
router.post('/restoreProduct',adminAuth,productController.restoreProduct);

router.get('/orders',adminAuth,ordersController.loadOrderPage);
router.get('/order',adminAuth,ordersController.loadOrderDetail);
router.post('/change-order-status',adminAuth,ordersController.changeOrderStatus);
router.post('/change-return-status',adminAuth,ordersController.changeReturnStatus);

router.get('/offers',adminAuth,offersController.getOfferPage);
router.get('/add-offer',adminAuth,offersController.getAddOfferPage);
router.post('/add-offer',adminAuth,offersController.addOffer);
router.get('/edit-offer/:id',adminAuth,offersController.getEditOffer);
router.post('/edit-offer/:id',adminAuth,offersController.editOffer);
router.get('/activate-offer',adminAuth, offersController.activateOffer);
router.get('/deactivate-offer',adminAuth, offersController.deactivateOffer);
router.get('/delete-offer',adminAuth, offersController.deleteOffer);
router.get('/restore-offer',adminAuth, offersController.restoreOffer);

router.get('/coupons', adminAuth, couponController.getCouponsPage);
router.get('/add-coupon', adminAuth, couponController.getAddCouponPage);
router.post('/add-coupon', adminAuth, couponController.addCoupon);
router.get('/edit-coupon', adminAuth, couponController.getEditCouponPage);
router.post('/edit-coupon/:id', adminAuth, couponController.updateCoupon);
router.get('/activate-coupon', adminAuth, couponController.activateCoupon);
router.get('/deactivate-coupon', adminAuth, couponController.deactivateCoupon);
router.get('/delete-coupon', adminAuth, couponController.deleteCoupon);
router.get('/restore-coupon', adminAuth, couponController.restoreCoupon);

module.exports = router;