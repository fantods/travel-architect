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
