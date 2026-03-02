# Trip Architect: Agentic Travel Itinerary Planner

### **Overview**

**Trip Architect** is a full-stack agentic AI application that generates personalized, feasible travel itineraries. It uses a cycle of **Perception → Action → Reflection** to ensure plans are realistic, accounting for weather, logistics, and operating hours.

This project is built entirely in **TypeScript**, leveraging the **Vercel AI SDK** for agentic orchestration and **Zod** for schema validation and structured data extraction.

---

### **Core Features**

1.  **Conversational Planning:** Collects user preferences (budget, interests, dietary restrictions) via natural chat.
2.  **Autonomous Tool Use:** Dynamically queries external APIs for weather, points of interest, and logistics.
3.  **Constraint Satisfaction:** Automatically rearranges schedules based on weather forecasts and travel distances.
4.  **Visual Output:** Renders the final itinerary on an interactive map using `react-map-gl` or `leaflet`.

---

### **Tech Stack**

| Component            | Technology                        | Purpose                                           |
| :------------------- | :-------------------------------- | :------------------------------------------------ |
| **Language**         | `TypeScript`                      | Type safety across the full stack.                |
| **Framework**        | `Next.js (App Router)`            | Full-stack framework (API Routes + UI).           |
| **AI Orchestration** | `Vercel AI SDK`                   | Manages agent state, tool calling, and streaming. |
| **Validation**       | `Zod`                             | Defines schemas for tools and structured output.  |
| **UI Components**    | `Tailwind CSS` + `Shadcn/UI`      | Modern, responsive chat interface.                |
| **External APIs**    | `OpenWeatherMap`, `Google Places` | Tools for fetching real-world data.               |

---

### **Agent Architecture**

Instead of a separate backend server, we use **Next.js Server Actions** or **Route Handlers**.

The **Vercel AI SDK** handles the agentic loop via the `maxSteps` parameter. This allows the LLM to call a tool, receive the result, and reason about whether to call another tool or answer the user, all within a single streaming response.

#### **The Flow:**

1.  **User Input:** User sends a message via the Next.js frontend.
2.  **Server Action:** The request hits a Server Action running the AI SDK's `streamText`.
3.  **Tool Execution:**
    - The LLM decides it needs weather data.
    - The SDK pauses the LLM, executes the TypeScript `getWeather` function.
    - The result is fed back to the LLM automatically.
4.  **Final Output:** The LLM returns the final itinerary.

---

### **Tool Specifications**

Tools are defined using **Zod** schemas for parameters. This provides type safety and auto-completion.

#### **1. `get_weather_forecast`**

- **Description:** Fetches the 5-day weather forecast for the destination.
- **Zod Schema:**
  ```typescript
  z.object({
    city: z.string().describe("The city to get weather for"),
    date_range: z.array(z.string()).describe("List of dates (YYYY-MM-DD)"),
  });
  ```

#### **2. `search_places`**

- **Description:** Finds points of interest (POIs) based on categories.
- **Zod Schema:**
  ```typescript
  z.object({
    location: z.string().describe("City or neighborhood"),
    category: z.enum(["museum", "restaurant", "park", "historical"]).describe("Type of place"),
  });
  ```

#### **3. `calculate_travel_time`**

- **Description:** Calculates travel time between two coordinates.
- **Zod Schema:**
  ```typescript
  z.object({
    origin: z.string().describe("Address or Lat/Long of start point"),
    destination: z.string().describe("Address or Lat/Long of end point"),
    mode: z.enum(["driving", "walking", "transit"]).optional(),
  });
  ```

---

### **Data Models (Structured Output)**

We force the LLM to output a JSON object that matches a specific Zod schema. This allows the frontend to parse the "Final Answer" safely and render a map.

```typescript
import { z } from "zod";

const ActivitySchema = z.object({
  time: z.string(),
  activity_name: z.string(),
  location: z.string(),
  description: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lon: z.number(),
  }),
  travel_time_from_previous: z.string(),
});

const DayPlanSchema = z.object({
  date: z.string(),
  weather_summary: z.string(),
  activities: z.array(ActivitySchema),
});

export const ItinerarySchema = z.object({
  destination: z.string(),
  total_days: z.number(),
  daily_itinerary: z.array(DayPlanSchema),
});
```

---

### **Step-by-Step Implementation Guide**

#### **Phase 1: Project Setup**

1.  Initialize Next.js: `npx create-next-app@latest trip-architect --typescript --tailwind`.
2.  Install dependencies:
    ```bash
    npm install ai @ai-sdk/openai zod googleapis openweather-api-node
    ```
3.  Set up environment variables in `.env.local` (`OPENAI_API_KEY`, `GOOGLE_PLACES_API_KEY`).

#### **Phase 2: Defining Tools**

Create a file `lib/tools.ts`. Implement the tools using standard `async` TypeScript functions.

```typescript
// lib/tools.ts
import { z } from "zod";
import { tool } from "ai";

export const getWeather = tool({
  description: "Get the weather forecast for a city",
  parameters: z.object({
    city: z.string(),
  }),
  execute: async ({ city }) => {
    // Mock implementation or call OpenWeather API here
    return { city, forecast: "Sunny, 25C" };
  },
});

export const searchPlaces = tool({
  description: "Search for places in a city",
  parameters: z.object({
    location: z.string(),
    category: z.string(),
  }),
  execute: async ({ location, category }) => {
    // Call Google Places API here
    return [{ name: "British Museum", lat: 51.5, lon: -0.1 }];
  },
});
```

#### **Phase 3: Agentic Backend (Route Handler)**

Create `app/api/chat/route.ts`. Use the `streamText` function with `maxSteps` to enable the agentic loop.

```typescript
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getWeather, searchPlaces } from "@/lib/tools";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4o"),
    messages,
    tools: { getWeather, searchPlaces },
    // This enables the agentic loop (LLM calls tools -> reads results -> repeats)
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
```

#### **Phase 4: Frontend UI**

Create `app/page.tsx`. Use the `useChat` hook from the Vercel AI SDK to handle the chat state.

```typescript
'use client';
import { useChat } from 'ai/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(m => (
          <div key={m.id} className="whitespace-pre-wrap mb-2">
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <input
          className="w-full p-2 border rounded"
          value={input}
          onChange={handleInputChange}
          placeholder="Plan a trip to Tokyo..."
        />
      </form>
    </div>
  );
}
```

---

### **Example Interaction**

**User:**

> "Plan a 2-day trip to London for this weekend. I love art."

**Agent (Internal Trace via `maxSteps`):**

1.  _Step 1:_ LLM calls `getWeather` tool with `{ city: "London" }`.
2.  _Step 2:_ Tool returns "Rain on Sunday".
3.  _Step 3:_ LLM calls `searchPlaces` with `{ location: "London", category: "museum" }`.
4.  _Step 4:_ LLM determines the plan is ready.
5.  _Final Output:_ Returns the JSON object matching `ItinerarySchema`.

**Frontend:**
Detects the structured JSON in the final message and renders a map component instead of plain text.

---

### **Portfolio Highlight Strategy**

Since you are using a unified TypeScript stack, highlight **Type Safety**:

- "The entire agent flow is type-safe. If I change a parameter in a Zod schema, TypeScript throws an error in the tool implementation immediately."
- Show how the frontend parses the structured response confidently because of the Zod validation.

### **Future Improvements**

- **Persisted History:** Save chat history to a database (e.g., Vercel KV or Postgres) using the Vercel AI SDK persistence hooks.
- **Map Visualization:** Integrate `react-map-gl` to plot the `coordinates` from the `ItinerarySchema` response.
