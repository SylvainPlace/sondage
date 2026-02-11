import pino from "pino";

// Create a logger instance with structured logging configuration
const transport = {
  target: "pino-pretty",
  options: {
    colorize: true,
    translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
    ignore: "pid,hostname",
  },
};

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "test" ? transport : undefined,
  base: {
    env: process.env.NODE_ENV || "development",
    service: "sondage-api",
  },
});

export default logger;
