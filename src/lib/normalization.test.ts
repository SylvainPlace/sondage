import { describe, it, expect } from "vitest";

import { parseSalaryRange, parsePrime } from "./frontend-utils";
import {
  normalizeJob,
  normalizeSector,
  normalizeRegion,
  parseExperience,
} from "./normalization";

describe("Normalization Logic", () => {
  describe("parseExperience", () => {
    it("should parse simple numbers", () => {
      expect(parseExperience("5")).toBe(5);
    });

    it("should parse ranges by taking average", () => {
      expect(parseExperience("2-4")).toBe(3); // (2+4)/2 = 3
      expect(parseExperience("5-10")).toBe(8); // (5+10)/2 = 7.5 -> ceil -> 8
    });

    it('should handle "10+" format', () => {
      expect(parseExperience("10+")).toBe(10);
    });

    it("should return 0 for empty or invalid input", () => {
      expect(parseExperience("")).toBe(0);
      expect(parseExperience(undefined)).toBe(0);
    });
  });

  describe("parseSalaryRange", () => {
    it('should parse "Moins de 30k€"', () => {
      expect(parseSalaryRange("Moins de 30 k€")).toBe(29000);
    });

    it('should parse "Plus de 100k€"', () => {
      expect(parseSalaryRange("Plus de 100 k€")).toBe(101000);
    });

    it('should parse ranges like "30-35k€"', () => {
      // "30-35" -> avg(30,35) * 1000 = 32500
      expect(parseSalaryRange("30-35 k€")).toBe(32500);
      expect(parseSalaryRange("45-50k€")).toBe(47500);
      expect(parseSalaryRange("50-60k€")).toBe(55000);
    });

    it("should return 0 for invalid input", () => {
      expect(parseSalaryRange("")).toBe(0);
      expect(parseSalaryRange("N/A")).toBe(0);
    });
  });

  describe("parsePrime", () => {
    it('should parse "Aucune"', () => {
      expect(parsePrime("Aucune")).toBe(0);
      expect(parsePrime("0")).toBe(0);
    });

    it('should parse "Moins de 2k€"', () => {
      expect(parsePrime("Moins de 2k€")).toBe(1000);
    });

    it('should parse ranges like "2-5k€"', () => {
      expect(parsePrime("2-5 k€")).toBe(3500);
    });
  });

  describe("normalizeJob", () => {
    it("should normalize Product Owner roles", () => {
      expect(normalizeJob("Product Owner")).toBe(
        "Product Owner / Product Manager",
      );
      expect(normalizeJob("PO")).toBe("Product Owner / Product Manager");
      expect(normalizeJob("PM")).toBe("Autre"); // Unless PM is added to keywords
    });

    it("should normalize Chef de Projet roles", () => {
      expect(normalizeJob("Chef de projet digital")).toBe("Chef de Projet");
      expect(normalizeJob("Scrum Master")).toBe("Chef de Projet");
    });

    it("should normalize Developers", () => {
      expect(normalizeJob("Développeur Fullstack")).toBe(
        "Développeur / Ingénieur",
      );
      expect(normalizeJob("Software Engineer")).toBe("Développeur / Ingénieur");
    });

    it("should normalize Data roles", () => {
      expect(normalizeJob("Data Scientist")).toBe("Data / BI");
      expect(normalizeJob("Consultant BI")).toBe("Data / BI");
    });
  });

  describe("normalizeSector", () => {
    it("should normalize Health Software", () => {
      expect(normalizeSector("Éditeur logiciel médical")).toBe(
        "Éditeur Logiciel Santé",
      );
    });

    it("should normalize Public Institutions", () => {
      expect(normalizeSector("Ministère de la Santé")).toBe(
        "Institution Publique",
      );
    });
  });

  describe("normalizeRegion", () => {
    it("should normalize Remote", () => {
      expect(normalizeRegion("Full télétravail")).toBe("Full Télétravail");
    });

    it("should normalize Occitanie", () => {
      expect(normalizeRegion("Toulouse (31)")).toBe("Occitanie");
    });

    it("should normalize International", () => {
      expect(normalizeRegion("Canada")).toBe("International");
    });
  });
});
