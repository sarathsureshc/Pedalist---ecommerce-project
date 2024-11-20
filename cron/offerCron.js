const cron = require("node-cron");
const Offer = require("../models/offerSchema");

const scheduleOfferExpiry = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      const currentDate = new Date();
      await Offer.updateMany(
        { endDate: { $lt: currentDate }, isActive: true },
        { isActive: false, isDeleted: true }
      );
      console.log("Updated offers to inactive where endDate has passed.");
    } catch (error) {
      console.error("Error updating offers:", error);
    }
  });
};

module.exports = scheduleOfferExpiry;
