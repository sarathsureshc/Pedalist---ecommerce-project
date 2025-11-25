const cron = require("node-cron");
const Offer = require("../models/offerSchema");
const logger = require("../config/logger");

const scheduleOfferExpiry = () => {
  // Run every day at midnight
  cron.schedule("0 0 * * *", async () => {
    try {
      const currentDate = new Date();
      const result = await Offer.updateMany(
        { endDate: { $lt: currentDate }, isActive: true },
        { isActive: false, isDeleted: true },
      );

      if (result.modifiedCount > 0) {
        logger.info(
          `Updated ${result.modifiedCount} expired offers to inactive`,
        );
      }
    } catch (error) {
      logger.error("Error updating expired offers:", error);
    }
  });

  logger.info("✅ Offer expiry cron job scheduled (runs daily at midnight)");
};

module.exports = scheduleOfferExpiry;
