import { z } from "zod"

import { contentStateConfig } from "~/config/content-state-config"

const MAX_COVER_UPLOAD_SIZE = 1024 * 1024 * 5 // 5 kB
const MAX_PDF_UPLOAD_SIZE = 1024 * 1024 * 10 // 10 MB

export const schema = z.object({
  id: z.string(),
  ordinalNumber: z
    .number({ message: "Pořadové číslo je povinné" })
    .int({ message: "Pořadové číslo musí být celé číslo" })
    .min(1, { message: "Pořadové číslo musí být větší než 0" })
    .transform((value) => value.toString()),
  releasedAt: z
    .string({ message: "Datum vydání je povinný" })
    .date("Datum vydání musí být ve formátu dd.mm.yyyy"),
  coverId: z.string().readonly(),
  cover: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || file.type.startsWith("image/"),
      "Formát souboru není podporován"
    )
    .refine((file) => !file || file.size <= MAX_COVER_UPLOAD_SIZE, {
      message: "Obálka by měla mít maximální velikost 5 MB",
    }),
  pdfId: z.string().readonly(),
  pdf: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.type === "application/pdf", {
      message: "Formát souboru není podporován",
    })
    .refine(
      (file) => {
        return !file || file.size <= MAX_PDF_UPLOAD_SIZE
      },
      { message: "PDF soubor by měl mít maximální velikost 10 MB" }
    ),
  state: z.enum(contentStateConfig.states as [string, ...string[]], {
    message: "Zvolený stav není podporován",
  }),
  publishedAt: z.string().optional(),
  authorId: z.string({ message: "Autor je povinný" }),
})
