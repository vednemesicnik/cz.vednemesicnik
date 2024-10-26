import { z } from "zod"

const MAX_COVER_UPLOAD_SIZE = 1024 * 200 // 200 kB
const MAX_PDF_UPLOAD_SIZE = 1024 * 1024 * 8 // 8 MB

export const schema = z.object({
  ordinalNumber: z
    .number({ message: "Ordinal number is required" })
    .int({ message: "Ordinal number must be an integer" })
    .positive({ message: "Ordinal number must be a positive integer" })
    .min(1, { message: "Ordinal number must be at least 1" })
    .transform((value) => value.toString()),
  publishedAt: z
    .string({ message: "Date of publication is required" })
    .date("Date should be in the YYYY-MM-DD format"),
  published: z.boolean().optional().default(false),
  cover: z
    .instanceof(File, { message: "Cover image is required" })
    .refine(
      (file) => file.type.startsWith("image/"),
      "Format of the cover image is not supported"
    )
    .refine(
      (file) => {
        return file.size <= MAX_COVER_UPLOAD_SIZE
      },
      { message: "Cover image should have a 200 kB maximum size" }
    ),
  pdf: z
    .instanceof(File, { message: "PDF file is required" })
    .refine((file) => file.type === "application/pdf", {
      message: "Format of the file is not supported",
    })
    .refine(
      (file) => {
        return file.size <= MAX_PDF_UPLOAD_SIZE
      },
      { message: "PDF file should have a 8 MB maximum size" }
    ),
})
