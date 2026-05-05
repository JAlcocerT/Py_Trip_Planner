import { z } from "zod";

export const stationIdSchema = z.string().min(1);

export const latLonSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

export const dateRangeSchema = z.object({
  station_id: stationIdSchema,
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const geocodeSchema = z.object({
  q: z.string().min(2),
});

export const variableSchema = z.enum(["tmax", "tmin", "wspd", "prcp"]);
