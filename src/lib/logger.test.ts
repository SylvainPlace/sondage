import { describe, it, expect } from "vitest";
import logger from "./logger";

describe("Logger", () => {
  it("should be defined", () => {
    expect(logger).toBeDefined();
  });

  it("should have expected logging methods", () => {
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  it("should log info message without throwing", () => {
    expect(() => {
      logger.info("Test info message");
    }).not.toThrow();
  });

  it("should log error message without throwing", () => {
    expect(() => {
      logger.error("Test error message");
    }).not.toThrow();
  });

  it("should log structured data", () => {
    expect(() => {
      logger.info({ test: "data", value: 123 }, "Structured log test");
    }).not.toThrow();
  });
});
