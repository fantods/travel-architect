import { tool } from "ai";
import { z } from "zod";

export const getWeatherForecast = tool({
  description: "Fetches the weather forecast for a city over a date range",
  inputSchema: z.object({
    city: z.string().describe("The city to get weather for"),
    date_range: z.array(z.string()).describe("List of dates (YYYY-MM-DD)"),
  }),
  execute: async ({ city, date_range }) => {
    const forecasts = date_range.map((date) => ({
      date,
      condition: Math.random() > 0.5 ? "Sunny" : "Cloudy",
      temperature_high: Math.floor(Math.random() * 15) + 15,
      temperature_low: Math.floor(Math.random() * 10) + 5,
      precipitation_chance: Math.floor(Math.random() * 100),
    }));
    return { city, forecasts };
  },
});

export const searchPlaces = tool({
  description: "Finds points of interest (POIs) based on categories",
  inputSchema: z.object({
    location: z.string().describe("City or neighborhood"),
    category: z
      .enum(["museum", "restaurant", "park", "historical", "art", "entertainment"])
      .describe("Type of place to search for"),
  }),
  execute: async ({ location, category }) => {
    const mockPlaces = {
      museum: [
        {
          name: "City Museum",
          lat: 51.5074,
          lon: -0.1278,
          rating: 4.5,
          address: "123 Museum St",
        },
        {
          name: "Art Gallery",
          lat: 51.5094,
          lon: -0.1298,
          rating: 4.7,
          address: "456 Gallery Ave",
        },
      ],
      restaurant: [
        {
          name: "The Local Bistro",
          lat: 51.5084,
          lon: -0.1268,
          rating: 4.3,
          address: "789 Food Rd",
        },
        {
          name: "Fine Dining",
          lat: 51.5064,
          lon: -0.1288,
          rating: 4.8,
          address: "321 Cuisine Blvd",
        },
      ],
      park: [
        {
          name: "Central Park",
          lat: 51.5054,
          lon: -0.1248,
          rating: 4.6,
          address: "Park Lane",
        },
        {
          name: "Riverside Gardens",
          lat: 51.5044,
          lon: -0.1238,
          rating: 4.4,
          address: "River Walk",
        },
      ],
      historical: [
        {
          name: "Old Town Square",
          lat: 51.5034,
          lon: -0.1228,
          rating: 4.5,
          address: "Heritage St",
        },
        {
          name: "Ancient Ruins",
          lat: 51.5024,
          lon: -0.1218,
          rating: 4.2,
          address: "History Ave",
        },
      ],
      art: [
        {
          name: "Modern Art Center",
          lat: 51.5014,
          lon: -0.1208,
          rating: 4.6,
          address: "Art District",
        },
        {
          name: "Sculpture Garden",
          lat: 51.5004,
          lon: -0.1198,
          rating: 4.4,
          address: "Creative Way",
        },
      ],
      entertainment: [
        {
          name: "City Theater",
          lat: 51.4994,
          lon: -0.1188,
          rating: 4.5,
          address: "Show St",
        },
        {
          name: "Comedy Club",
          lat: 51.4984,
          lon: -0.1178,
          rating: 4.3,
          address: "Laughter Lane",
        },
      ],
    } as const;

    return {
      location,
      category,
      places: mockPlaces[category] || [],
    };
  },
});

export const calculateTravelTime = tool({
  description: "Calculates travel time between two locations",
  inputSchema: z.object({
    origin: z.string().describe("Address or coordinates of start point"),
    destination: z.string().describe("Address or coordinates of end point"),
    mode: z.enum(["driving", "walking", "transit"]).optional().default("transit"),
  }),
  execute: async ({ origin, destination, mode = "transit" }) => {
    const baseTime = Math.floor(Math.random() * 30) + 5;
    const multipliers = { driving: 1, walking: 3, transit: 1.5 } as const;
    const travelTime = Math.floor(baseTime * multipliers[mode]);

    return {
      origin,
      destination,
      mode,
      duration_minutes: travelTime,
      distance_km: Math.floor(travelTime * 0.5),
    };
  },
});
