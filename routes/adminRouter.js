const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController");
const brandController = require("../controllers/admin/brandController");
const productController = require("../controllers/admin/productController");
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
router.get("/blockCustomer", adminAuth,customerController.customerBlocked);
router.get("/unblockCustomer", adminAuth,customerController.customerUnBlocked);

router.get("/category",adminAuth,categoryController.categoryInfo);
router.post("/addCategory",adminAuth,categoryController.addCategory);
router.post("/addCategoryOffer",adminAuth,categoryController.addCategoryOffer);
router.post("/removeCategoryOffer",adminAuth,categoryController.removeCategoryOffer);
router.get("/listCategory",adminAuth,categoryController.getListCategory);
router.get("/unlistCategory",adminAuth,categoryController.getUnlistCategory);
router.get("/editCategory",adminAuth,categoryController.getEditCategory);
router.post("/editCategory/:id",adminAuth,categoryController.editCategory);
router.post('/deleteCategory',adminAuth,categoryController.deleteCategory);
router.post('/restoreCategory',adminAuth,categoryController.restoreCategory);

router.get('/brands',adminAuth,brandController.getBrandPage);
router.post("/addBrand",adminAuth,uploads.single("image"),brandController.addBrand);
router.get("/unblockBrand",adminAuth,brandController.getUnblockBrand);
router.get("/blockBrand",adminAuth,brandController.getBlockBrand);
router.get("/editBrand",adminAuth,brandController.getEditBrand);
router.post("/editBrand/:id",adminAuth,uploads.single('image'),brandController.editBrand);
router.post('/deleteBrand',adminAuth,brandController.deleteBrand);
router.post('/restoreBrand',adminAuth,brandController.restoreBrand);

router.get("/products",adminAuth,productController.getProductPage)
router.get("/addProduct",adminAuth, productController.getProductAddPage);
router.post("/addProduct",adminAuth,uploads.array("images",4), productController.addProducts);

module.exports = router;