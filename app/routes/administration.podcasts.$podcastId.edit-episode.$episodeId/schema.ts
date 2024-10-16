import { z } from "zod"

import { slugify } from "~/utils/slugify"

export const schema = z.object({
  title: z
    .string({ message: "Title is required" })
    .regex(/^\S/, "Title cannot start with a space"),
  slug: z
    .string({ message: "Slug is required" })
    .regex(/^\S/, "Slug cannot start with a space")
    .regex(/^[^-]/, "Slug cannot start with a hyphen")
    .transform(slugify),
  description: z.string({ message: "Description is required" }),
  published: z.boolean().optional().default(false),
  publishedAt: z
    .string({ message: "Date is required" })
    .date("Date should be in the YYYY-MM-DD format"),
  podcastId: z.string().readonly(),
  episodeId: z.string().readonly(),
})
