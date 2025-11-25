const express = require("express");
const app = express();
const path = require("path");

// Load environment variables FIRST
require("dotenv").config();

// Validate environment variables
const validateEnv = require("./config/validateEnv");
validateEnv();

// Initialize logger
const logger = require("./config/logger");

// Security middleware
const helmet = require("helmet");
const cors = require("cors");

// Session and authentication
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("./config/passport");
const flash = require("connect-flash");

// Database connection
const db = require("./config/db");

// Error handling
const { errorHandler, notFound } = require("./middlewares/errorHandler");

// Routes
const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter.js");
const healthRouter = require("./routes/healthRouter");

// Cron jobs
const scheduleOfferExpiry = require("./cron/offerCron");
const scheduleKeepAlive = require("./cron/keepAlive");

// Connect to database
db();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdn.jsdelivr.net",
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://checkout.razorpay.com",
          "https://cdn.jsdelivr.net",
        ],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://api.razorpay.com"],
        frameSrc: ["https://api.razorpay.com"],
      },
    },
  }),
);

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
  ],
  optionsSuccessStatus: 200,
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration with MongoDB store
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 72 * 60 * 60, // 3 days
      autoRemove: "native",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
      sameSite: "strict",
    },
  }),
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Cache control
app.use((req, res, next) => {
  res.set("cache-control", "no-store");
  next();
});

// Flash messages
app.use(flash());
app.use((req, res, next) => {
  res.locals.errorMessage = req.flash("error");
  res.locals.successMessage = req.flash("success");
  next();
});

// View engine setup
app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views/admin"),
  path.join(__dirname, "views/user"),
]);

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Health check routes (must be before authentication)
app.use("/", healthRouter);

// Routes
app.use("/admin", adminRouter);
app.use("/", userRouter);

// Start cron jobs
scheduleOfferExpiry();
scheduleKeepAlive();

// 404 handler - must be after all routes
app.use(notFound);

// Global error handler - must be last
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});

module.exports = app;
