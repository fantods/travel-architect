import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/chat/route";

vi.mock("@/lib/places", () => ({
  extractDestination: vi.fn(() => "Tokyo"),
  extractPlaceNamesRegex: vi.fn(() => ["Meiji Shrine"]),
  searchMultiplePlaces: vi.fn(() => new Map([["Meiji Shrine", "https://maps.google.com/place/1"]])),
}));

vi.mock("@/lib/place-extractor", () => ({
  extractPlacesWithAI: vi.fn(() => Promise.resolve([{ name: "Meiji Shrine", confidence: 0.9 }])),
}));

describe("Chat API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return a message with content", async () => {
    const mockOllamaResponse = {
      message: {
        content: "Visit Meiji Shrine in Tokyo",
      },
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockOllamaResponse),
    } as Response);

    const request = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Plan a trip to Tokyo" }],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.message).toBeDefined();
    expect(data.message.content).toBeDefined();
  });

  it("should extract destination from user message", async () => {
    const mockOllamaResponse = {
      message: {
        content: "Here's your itinerary",
      },
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockOllamaResponse),
    } as Response);

    const request = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Plan a trip to Tokyo" }],
      }),
    });

    await POST(request);

    const { extractDestination } = await import("@/lib/places");
    expect(extractDestination).toHaveBeenCalledWith("Plan a trip to Tokyo");
  });

  it("should call Ollama API with correct model", async () => {
    const mockOllamaResponse = {
      message: {
        content: "Itinerary",
      },
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockOllamaResponse),
    } as Response);

    const request = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Plan a trip" }],
      }),
    });

    await POST(request);

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body.model).toBe("qwen2.5:7b");
  });

  it("should handle empty messages array", async () => {
    const mockOllamaResponse = {
      message: {
        content: "Hello",
      },
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockOllamaResponse),
    } as Response);

    const request = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBeDefined();
  });

  it("should handle Ollama API errors gracefully", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

    const request = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Plan a trip" }],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});
