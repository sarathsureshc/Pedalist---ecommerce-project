const { body, validationResult } = require("express-validator");

const signupValidation = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be 2-50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("First name can only contain letters"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Last name must not exceed 50 characters")
    .matches(/^[a-zA-Z\s]*$/)
    .withMessage("Last name can only contain letters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain uppercase, lowercase, number, and special character",
    ),

  body("mobileNumber")
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile number must be 10 digits"),

  body("referral").optional().trim(),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

const addressValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be 2-100 characters"),

  body("houseName")
    .trim()
    .notEmpty()
    .withMessage("House name/number is required")
    .isLength({ max: 200 })
    .withMessage("House name must not exceed 200 characters"),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .isLength({ max: 100 })
    .withMessage("City name must not exceed 100 characters"),

  body("state")
    .trim()
    .notEmpty()
    .withMessage("State is required")
    .isLength({ max: 100 })
    .withMessage("State name must not exceed 100 characters"),

  body("pincode")
    .trim()
    .notEmpty()
    .withMessage("Pincode is required")
    .matches(/^[0-9]{6}$/)
    .withMessage("Pincode must be 6 digits"),

  body("landMark")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Landmark must not exceed 200 characters"),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must be 10 digits"),

  body("altPhone")
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Alternate phone must be 10 digits"),
];

const productValidation = [
  body("productName")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Product name must be 3-200 characters"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be 10-2000 characters"),

  body("color").trim().notEmpty().withMessage("Color is required"),

  body("category").notEmpty().withMessage("Category is required"),

  body("brand").notEmpty().withMessage("Brand is required"),
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);

    // For JSON requests
    if (req.accepts("json") && !req.accepts("html")) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // For form submissions, flash errors and redirect back
    req.flash("error", errorMessages.join(", "));
    return res.redirect("back");
  }
  next();
};

module.exports = {
  signupValidation,
  loginValidation,
  addressValidation,
  productValidation,
  handleValidationErrors,
};
