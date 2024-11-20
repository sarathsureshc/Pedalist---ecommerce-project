const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController");
const brandController = require("../controllers/admin/brandController");
const productController = require("../controllers/admin/productController");
const ordersController = require("../controllers/admin/ordersController");
const offersController = require("../controllers/admin/offerController");
const couponController = require("../controllers/admin/couponController");
const reportController = require("../controllers/admin/reportController");
const { userAuth, adminAuth } = require("../middlewares/auth");
const multer = require("multer");
const storage = require("../helpers/multer");
const uploads = multer({ storage: storage });

router.get("/pageerror", adminController.pageerror);
router.get("/login", adminController.loadLogin);
router.post("/login", adminController.login);

router.use(adminAuth);

router.get("/", adminController.loadDashboard);
router.get("/sales-data", adminController.getSalesData);
router.get("/generate-ledger", adminController.generateLedger);
router.get("/logout", adminController.logout);

router.get("/users", customerController.customerInfo);
router.post("/blockCustomer", customerController.customerBlocked);
router.post("/unblockCustomer", customerController.customerUnBlocked);

router.get("/category", categoryController.categoryInfo);
router.post("/add-category", categoryController.addCategory);
router.get("/list-category", categoryController.getListCategory);
router.get("/unlist-category", categoryController.getUnlistCategory);
router.get("/edit-category", categoryController.getEditCategory);
router.post("/edit-category/:id", categoryController.editCategory);
router.post("/delete-category", categoryController.deleteCategory);
router.post("/restore-category", categoryController.restoreCategory);

router.get("/brands", brandController.getBrandPage);
router.post("/add-brand", uploads.single("image"), brandController.addBrand);
router.get("/unblock-brand", brandController.getUnblockBrand);
router.get("/block-brand", brandController.getBlockBrand);
router.get("/edit-brand", brandController.getEditBrand);
router.post(
  "/edit-brand/:id",
  uploads.single("image"),
  brandController.editBrand
);
router.post("/delete-brand", brandController.deleteBrand);
router.post("/restore-brand", brandController.restoreBrand);

router.get("/products", productController.getProductPage);
router.get("/add-product", productController.getProductAddPage);
router.post(
  "/add-product",
  uploads.array("images", 4),
  productController.addProducts
);
router.get("/list-product", productController.getListProduct);
router.get("/unlist-product", productController.getUnlistProduct);
router.get("/edit-product", productController.getEditProduct);
router.post(
  "/edit-product/:id",
  uploads.array("images", 4),
  productController.editProduct
);
router.post("/delete-image", productController.deleteSingleImage);
router.post("/delete-product", productController.deleteProduct);
router.post("/restore-product", productController.restoreProduct);

router.get("/orders", ordersController.loadOrderPage);
router.get("/order", ordersController.loadOrderDetail);
router.post("/change-order-status", ordersController.changeOrderStatus);
router.post("/change-return-status", ordersController.changeReturnStatus);

router.get("/offers", offersController.getOfferPage);
router.get("/add-offer", offersController.getAddOfferPage);
router.post("/add-offer", offersController.addOffer);
router.get("/edit-offer/:id", offersController.getEditOffer);
router.post("/edit-offer/:id", offersController.editOffer);
router.get("/activate-offer", offersController.activateOffer);
router.get("/deactivate-offer", offersController.deactivateOffer);
router.get("/delete-offer", offersController.deleteOffer);
router.get("/restore-offer", offersController.restoreOffer);

router.get("/coupons", couponController.getCouponsPage);
router.get("/add-coupon", couponController.getAddCouponPage);
router.post("/add-coupon", couponController.addCoupon);
router.get("/edit-coupon", couponController.getEditCouponPage);
router.post("/edit-coupon/:id", couponController.updateCoupon);
router.get("/activate-coupon", couponController.activateCoupon);
router.get("/deactivate-coupon", couponController.deactivateCoupon);
router.get("/delete-coupon", couponController.deleteCoupon);
router.get("/restore-coupon", couponController.restoreCoupon);

router.get("/sales-report", reportController.getSalesReport);
router.get("/sales-report-pdf", reportController.downloadSalesReportPDF);
router.get("/sales-report-excel", reportController.downloadSalesReportExcel);

module.exports = router;
