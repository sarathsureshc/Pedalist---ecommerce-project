const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const logger = require("../config/logger");

/**
 * Health check endpoint
 * Used by monitoring services and keep-alive pings
 */
router.get("/health", (req, res) => {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    services: {
      database:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    },
  };

  const statusCode = health.services.database === "connected" ? 200 : 503;

  logger.debug("Health check requested", { ip: req.ip });

  res.status(statusCode).json(health);
});

/**
 * Ping endpoint for keep-alive
 * Lightweight endpoint that just confirms the server is running
 */
router.get("/ping", (req, res) => {
  logger.debug("Keep-alive ping received", { ip: req.ip });
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Metrics endpoint
 * Provides basic server metrics
 */
router.get("/metrics", (req, res) => {
  const metrics = {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(metrics);
});

module.exports = router;
