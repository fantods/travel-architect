import { z } from "zod";

export const CoordinatesSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

export const ActivitySchema = z.object({
  time: z.string(),
  activity_name: z.string(),
  location: z.string(),
  description: z.string(),
  coordinates: CoordinatesSchema,
  travel_time_from_previous: z.string(),
});

export const DayPlanSchema = z.object({
  date: z.string(),
  weather_summary: z.string(),
  activities: z.array(ActivitySchema),
});

export const ItinerarySchema = z.object({
  destination: z.string(),
  total_days: z.number(),
  daily_itinerary: z.array(DayPlanSchema),
});

export type Coordinates = z.infer<typeof CoordinatesSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
export type DayPlan = z.infer<typeof DayPlanSchema>;
export type Itinerary = z.infer<typeof ItinerarySchema>;
