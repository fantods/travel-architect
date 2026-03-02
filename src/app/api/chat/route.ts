import { extractPlacesWithAI } from "@/lib/place-extractor";
import { extractDestination, extractPlaceNamesRegex, searchMultiplePlaces } from "@/lib/places";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content || msg.parts?.map((p: any) => p.text).join("") || "",
    }));

    let destination: string | null = null;
    for (const msg of formattedMessages) {
      if (msg.role === "user") {
        destination = extractDestination(msg.content);
        if (destination) break;
      }
    }

    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5:7b",
        messages: [
          {
            role: "system",
            content: `You are Trip Architect, a helpful travel planning assistant.

CRITICAL: You must add EXPLICIT blank lines (two newline characters) between EVERY element:
- Two blank lines before each day heading
- One blank line before and after each subheading
- One blank line before and after each list
- One blank line between paragraphs

Use this EXACT format for each day:

---

## Day 1: [Title]

Brief intro paragraph about the day.

**Morning**

- Activity 1: description
- Activity 2: description

**Afternoon**

- Activity 3: description

**Evening**

- Activity 4: description

---

## Day 2: [Title]

Brief intro paragraph.

**Morning**

- Activity 1

(Notice the blank lines EVERYWHERE - this is mandatory for readability)
`,
          },
          ...formattedMessages,
        ],
        stream: false,
      }),
    });

    const data = await response.json();
    let content = data.message?.content || "";

    let placeNames = await extractPlacesWithAI(content, destination || undefined);

    if (placeNames.length === 0) {
      console.log("AI extraction returned no places, falling back to regex");
      const regexPlaces = extractPlaceNamesRegex(content);
      placeNames = regexPlaces.map((name) => ({ name, confidence: 0.75 }));
    }

    if (placeNames.length > 0) {
      const highConfidencePlaces = placeNames.filter((p) => p.confidence >= 0.7);
      const placeNamesList = highConfidencePlaces.map((p) => p.name);
      const placeUrls = await searchMultiplePlaces(placeNamesList, destination || undefined);

      for (const [place, url] of placeUrls) {
        const escapedPlace = place.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(\\b${escapedPlace}\\b)(?![^\\[]*\\])`, "g");
        content = content.replace(regex, `[${place}](${url})`);
      }
    }

    return Response.json({
      message: { ...data.message, content },
    });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
