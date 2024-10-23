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
router.post("/blockCustomer", adminAuth,customerController.customerBlocked);
router.post("/unblockCustomer", adminAuth,customerController.customerUnBlocked);

router.get("/category",adminAuth,categoryController.categoryInfo);
router.post("/add-category",adminAuth,categoryController.addCategory);
router.post("/add-category-offer",adminAuth,categoryController.addCategoryOffer);
router.post("/remove-category-offer",adminAuth,categoryController.removeCategoryOffer);
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

module.exports = router;