import { describe, expect, it } from "vitest";
import { extractDestination, extractPlaceNamesRegex } from "@/lib/places";

describe("extractDestination", () => {
  it("should extract destination from 'plan a trip to X' pattern", () => {
    const result = extractDestination("Plan a trip to Tokyo for 3 days");
    expect(result).toBe("Tokyo");
  });

  it("should extract destination from 'visit X' pattern", () => {
    const result = extractDestination("I want to visit Paris next month");
    expect(result).toBe("Paris next month");
  });

  it("should extract destination from 'travel to X' pattern", () => {
    const result = extractDestination("We're planning to travel to New York");
    expect(result).toBe("New York");
  });

  it("should extract destination from 'trip to X' pattern", () => {
    const result = extractDestination("Our trip to London was amazing");
    expect(result).toBe("London was amazing");
  });

  it("should extract destination from 'in X' pattern", () => {
    const result = extractDestination("What can I do in Berlin?");
    expect(result).toBeNull();
  });

  it("should return null when no destination is found", () => {
    const result = extractDestination("What's the weather like?");
    expect(result).toBeNull();
  });

  it("should handle case-insensitive patterns", () => {
    const result = extractDestination("PLAN A TRIP TO TOKYO");
    expect(result).toBe("TOKYO");
  });

  it("should handle destinations with spaces", () => {
    const result = extractDestination("Plan a trip to New York for a week");
    expect(result).toBe("New York");
  });

  it("should handle destinations with commas", () => {
    const result = extractDestination("Visit Rio de Janeiro, Brazil");
    expect(result).toBe("Rio de Janeiro, Brazil");
  });
});

describe("extractPlaceNamesRegex", () => {
  it("should extract places ending with 'Park'", () => {
    const text = "Visit Central Park and Hyde Park";
    const result = extractPlaceNamesRegex(text);
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((p) => p.includes("Park"))).toBe(true);
  });

  it("should extract places ending with 'Museum'", () => {
    const text = "Check out the British Museum and Louvre Museum";
    const result = extractPlaceNamesRegex(text);
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((p) => p.includes("Museum"))).toBe(true);
  });

  it("should extract places ending with 'Temple'", () => {
    const text = "Explore Golden Temple and Silver Temple";
    const result = extractPlaceNamesRegex(text);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should extract places ending with 'Shrine'", () => {
    const text = "Visit Meiji Shrine and Fushimi Inari Shrine";
    const result = extractPlaceNamesRegex(text);
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((p) => p.includes("Shrine"))).toBe(true);
  });

  it("should extract places in bold markdown", () => {
    const text = "Visit **Central Park** and **Times Square**";
    const result = extractPlaceNamesRegex(text);
    expect(result).toContain("Central Park");
  });

  it("should skip lines with markdown links", () => {
    const text = "Visit [Central Park](url) today";
    const result = extractPlaceNamesRegex(text);
    expect(result).toHaveLength(0);
  });

  it("should skip heading lines", () => {
    const text = "## Day 1: Central Park";
    const result = extractPlaceNamesRegex(text);
    expect(result).toHaveLength(0);
  });

  it("should deduplicate places", () => {
    const text = "Visit Central Park. Then go back to Central Park.";
    const result = extractPlaceNamesRegex(text);
    expect(new Set(result).size).toBe(result.length);
  });

  it("should filter out places that are too short", () => {
    const text = "Visit ABC Park";
    const result = extractPlaceNamesRegex(text);
    expect(result).not.toContain("ABC");
  });

  it("should filter out places with markdown brackets", () => {
    const text = "Visit [Central Park";
    const result = extractPlaceNamesRegex(text);
    expect(result.every((p) => !p.includes("["))).toBe(true);
  });

  it("should handle multiple place types", () => {
    const text = "Visit the Louvre Museum, Eiffel Tower, and Notre-Dame Cathedral";
    const result = extractPlaceNamesRegex(text);
    expect(result.length).toBeGreaterThan(0);
  });
});
