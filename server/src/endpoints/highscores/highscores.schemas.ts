import { z } from "zod"

export const HighscoresSchema = z.object({
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  score: z.number(),
})

export type Highscores = z.infer<typeof HighscoresSchema>
