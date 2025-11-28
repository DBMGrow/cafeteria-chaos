import { z } from "zod"

export const LocationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  password: z.string().min(5, "Password must be at least 5 characters"),
  location_type: z.enum(["admin", "user"]),
  google_place_id: z.string(),
})

export const GoogleSearchQuerySchema = z.object({
  search: z.string().min(1, "Search query is required"),
})

export type Location = z.infer<typeof LocationSchema>
export type GoogleSearchQuery = z.infer<typeof GoogleSearchQuerySchema>