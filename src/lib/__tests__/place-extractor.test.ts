import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractPlacesWithAI } from "@/lib/place-extractor";

describe("extractPlacesWithAI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should extract places from itinerary text", async () => {
    const mockResponse = {
      message: {
        content: JSON.stringify([
          { name: "Meiji Shrine", confidence: 0.95 },
          { name: "Shibuya Crossing", confidence: 0.9 },
        ]),
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const text = "Visit Meiji Shrine and Shibuya Crossing in Tokyo";
    const result = await extractPlacesWithAI(text);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: "Meiji Shrine", confidence: 0.95 });
    expect(result[1]).toEqual({ name: "Shibuya Crossing", confidence: 0.9 });
  });

  it("should filter places with confidence < 0.7", async () => {
    const mockResponse = {
      message: {
        content: JSON.stringify([
          { name: "High Confidence Place", confidence: 0.95 },
          { name: "Low Confidence Place", confidence: 0.5 },
        ]),
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const result = await extractPlacesWithAI("Some text");

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("High Confidence Place");
  });

  it("should include destination context in prompt", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          message: { content: "[]" },
        }),
    });

    global.fetch = mockFetch;

    await extractPlacesWithAI("Visit the park", "Tokyo");

    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body.messages[0].content).toContain("These places are in/near Tokyo");
  });

  it("should return empty array when no JSON found", async () => {
    const mockResponse = {
      message: {
        content: "No JSON here",
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const result = await extractPlacesWithAI("Some text");

    expect(result).toEqual([]);
  });

  it("should return empty array on fetch error", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await extractPlacesWithAI("Some text");

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should filter places with invalid names", async () => {
    const mockResponse = {
      message: {
        content: JSON.stringify([
          { name: "Valid Place", confidence: 0.9 },
          { name: "", confidence: 0.9 },
          { name: "A", confidence: 0.9 },
          { confidence: 0.9 },
        ]),
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const result = await extractPlacesWithAI("Some text");

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Valid Place");
  });

  it("should use llama3.2 model", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          message: { content: "[]" },
        }),
    });

    global.fetch = mockFetch;

    await extractPlacesWithAI("Some text");

    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body.model).toBe("llama3.2:latest");
  });

  it("should use low temperature for consistency", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          message: { content: "[]" },
        }),
    });

    global.fetch = mockFetch;

    await extractPlacesWithAI("Some text");

    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body.options.temperature).toBe(0.1);
  });
});
