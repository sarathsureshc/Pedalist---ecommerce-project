const logger = require("../config/logger");

// 404 handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?._id || req.session?.user,
  });

  // Render error page for web requests, JSON for API requests
  if (req.accepts("html")) {
    res.status(statusCode).render("pageNotFound", {
      message: statusCode === 404 ? "Page not found" : "Something went wrong",
      error: process.env.NODE_ENV === "development" ? err : {},
    });
  } else {
    res.status(statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, notFound, asyncHandler };
