const cron = require("node-cron");
const axios = require("axios");
const logger = require("../config/logger");

/**
 * Keep-alive cron job to prevent Render free tier from sleeping
 * Pings the server every 14 minutes (Render sleeps after 15 minutes of inactivity)
 */
const scheduleKeepAlive = () => {
  // Only run in production and if RENDER_URL is set
  if (
    process.env.NODE_ENV !== "production" ||
    !process.env.RENDER_EXTERNAL_URL
  ) {
    logger.info(
      "⏸️  Keep-alive cron job disabled (not in production or RENDER_EXTERNAL_URL not set)",
    );
    return;
  }

  const renderUrl = process.env.RENDER_EXTERNAL_URL;
  const pingUrl = `${renderUrl}/ping`;

  // Run every 14 minutes
  cron.schedule("*/14 * * * *", async () => {
    try {
      const startTime = Date.now();
      const response = await axios.get(pingUrl, {
        timeout: 10000, // 10 second timeout
        headers: {
          "User-Agent": "Pedalist-KeepAlive/1.0",
        },
      });

      const responseTime = Date.now() - startTime;

      if (response.status === 200) {
        logger.info(
          `✅ Keep-alive ping successful (${responseTime}ms) - Server staying active`,
        );
      } else {
        logger.warn(
          `⚠️  Keep-alive ping returned status ${response.status}`,
          {
            responseTime,
          },
        );
      }
    } catch (error) {
      logger.error("❌ Keep-alive ping failed:", {
        error: error.message,
        url: pingUrl,
      });
    }
  });

  logger.info(
    `✅ Keep-alive cron job scheduled (pings ${pingUrl} every 14 minutes)`,
  );
};

module.exports = scheduleKeepAlive;
