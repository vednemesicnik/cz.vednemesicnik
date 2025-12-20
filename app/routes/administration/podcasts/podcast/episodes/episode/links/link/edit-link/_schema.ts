import { z } from "zod"

export const schema = z.object({
  podcastId: z.string().readonly(),
  episodeId: z.string().readonly(),
  linkId: z.string().readonly(),
  label: z.string({ message: "Label is required" }),
  url: z
    .string({ message: "URL is required" })
    .url({ message: "URL is not valid" }),
  authorId: z.string(),
})
