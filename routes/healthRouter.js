const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const logger = require("../config/logger");

/**
 * Health check endpoint
 * Used by monitoring services and keep-alive pings
 */
router.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    }[dbState] || "unknown";

  const health = {
    status: dbStatus === "connected" ? "OK" : "DEGRADED",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    services: {
      database: dbStatus,
      databaseState: dbState,
    },
  };

  // Return 200 even if DB is down so health check doesn't fail
  // This allows debugging of DB connection issues
  const statusCode = 200;

  logger.debug("Health check requested", {
    ip: req.ip,
    dbStatus,
  });

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
