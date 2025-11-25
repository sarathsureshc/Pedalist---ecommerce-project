const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
  try {
    const options = {
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
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
    logger.error("❌ MongoDB Connection error:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed on app termination");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed on SIGTERM");
  process.exit(0);
});

module.exports = connectDB;
