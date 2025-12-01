const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
  try {
    const options = {
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of hanging
      family: 4, // Use IPv4
    };

    await mongoose.connect(process.env.MONGODB_URI, options);

    logger.info("✅ MongoDB Connected");

    // Log queries in development
    if (process.env.NODE_ENV === "development") {
      mongoose.set("debug", (collectionName, method, query) => {
        logger.debug(`Mongoose: ${collectionName}.${method}`, query);
      });
    }
  } catch (error) {
    logger.error("❌ MongoDB Connection error:", {
      message: error.message,
      name: error.name,
    });

    // In production, log error but don't exit - allow app to stay up for debugging
    if (process.env.NODE_ENV === "production") {
      logger.error(
        "⚠️  App running without database. Health check will show degraded status.",
      );
      logger.error("Please check MONGODB_URI environment variable.");
      // Don't exit - let health endpoint report the issue
    } else {
      // In development, exit to make the problem obvious
      process.exit(1);
    }
  }
};

// Handle connection events
mongoose.connection.on("connected", () => {
  logger.info("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  logger.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("Mongoose disconnected from MongoDB");
});

// Graceful shutdown
const gracefulShutdown = async (msg, callback) => {
  await mongoose.connection.close();
  logger.info(`MongoDB connection closed through ${msg}`);
  callback();
};

process.on("SIGINT", () => {
  gracefulShutdown("app termination", () => {
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  gracefulShutdown("Render shutdown", () => {
    process.exit(0);
  });
});

// Reconnection logic
mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected. Attempting to reconnect in 5 seconds...");
  setTimeout(() => {
    connectDB();
  }, 5000);
});

module.exports = connectDB;
