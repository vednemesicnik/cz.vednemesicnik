import { z } from "zod"

import { slugify } from "~/utils/slugify"

const MAX_COVER_UPLOAD_SIZE = 1024 * 200 // 200 kB

export const schema = z.object({
  id: z.string(),
  title: z
    .string({ message: "Title is required" })
    .regex(/^\S/, "Title cannot start with a space"),
  slug: z
    .string({ message: "Slug is required" })
    .regex(/^\S/, "Slug cannot start with a space")
    .regex(/^[^-]/, "Slug cannot start with a hyphen")
    .transform(slugify),
  description: z.string({ message: "Description is required" }),
  cover: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || file.type.startsWith("image/"),
      "Format of the cover image is not supported"
    )
    .refine(
      (file) => !file || file.size <= MAX_COVER_UPLOAD_SIZE,
      "Cover image should have a 200 kB maximum size"
    ),
  coverId: z.string(),
})
