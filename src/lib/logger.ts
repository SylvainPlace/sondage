import pino from "pino";

// Create a logger instance with structured logging configuration
// Note: We don't use pino-pretty in production (Cloudflare Workers) as it's not available
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: {
    env: process.env.NODE_ENV || "development",
    service: "sondage-api",
  },
});

export default logger;
