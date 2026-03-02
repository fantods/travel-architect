import { openai } from "@ai-sdk/openai";
import { stepCountIs, streamText } from "ai";
import {
  calculateTravelTime,
  getWeatherForecast,
  searchPlaces,
} from "@/lib/tools";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: `You are Trip Architect, an AI travel planning assistant. You help users plan detailed, personalized travel itineraries.

When planning trips:
1. First understand the user's preferences (budget, interests, dietary restrictions, travel style)
2. Use available tools to gather real-time information about weather, places, and travel times
3. Create realistic itineraries that account for travel time, opening hours, and weather
4. Always be specific with times, locations, and recommendations
5. Consider the user's interests when suggesting activities

Available tools:
- getWeatherForecast: Check weather for planning outdoor vs indoor activities
- searchPlaces: Find restaurants, museums, parks, historical sites, art venues, and entertainment
- calculateTravelTime: Estimate travel time between locations for realistic scheduling

When you have gathered enough information and created a plan, present the itinerary in a clear, structured format with:
- Destination overview
- Daily breakdown with specific times
- Activity descriptions with locations
- Travel time between activities
- Weather considerations`,
    messages,
    tools: {
      getWeatherForecast,
      searchPlaces,
      calculateTravelTime,
    },
    stopWhen: stepCountIs(10),
  });

  return result.toTextStreamResponse();
}
