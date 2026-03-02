export interface ExtractedPlace {
  name: string;
  confidence: number;
}

export async function extractPlacesWithAI(
  text: string,
  destination?: string,
): Promise<ExtractedPlace[]> {
  const prompt = `You are a place name extraction assistant. Extract all location names from the following travel itinerary.

Rules:
1. Only extract actual place names (attractions, landmarks, restaurants, hotels, parks, museums, etc.)
2. Do NOT extract city names, country names, or generic terms
3. Assign a confidence score (0.0 to 1.0) based on how certain you are
4. Only include places with confidence >= 0.7
${destination ? `5. These places are in/near ${destination}` : ""}

Return ONLY a valid JSON array with this exact format:
[
  {"name": "Place Name", "confidence": 0.95},
  {"name": "Another Place", "confidence": 0.85}
]

If no places found, return: []

Itinerary:
${text}`;

  try {
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2:latest",
        messages: [{ role: "user", content: prompt }],
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 2048,
        },
      }),
    });

    const data = await response.json();
    const content = data.message?.content || "";

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON array found in response:", content);
      return [];
    }

    const places: ExtractedPlace[] = JSON.parse(jsonMatch[0]);

    return places.filter(
      (place) =>
        place.name &&
        typeof place.confidence === "number" &&
        place.confidence >= 0.7 &&
        place.name.length > 2 &&
        place.name.length < 100,
    );
  } catch (error) {
    console.error("Error extracting places with AI:", error);
    return [];
  }
}
