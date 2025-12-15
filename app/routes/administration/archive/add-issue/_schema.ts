import { z } from "zod"

const MAX_COVER_UPLOAD_SIZE = 1024 * 1024 * 5 // 5 kB
const MAX_PDF_UPLOAD_SIZE = 1024 * 1024 * 10 // 10 MB

export const schema = z.object({
  ordinalNumber: z
    .number({ message: "Pořadové číslo je povinné" })
    .int({ message: "Pořadové číslo musí být celé číslo" })
    .min(1, { message: "Pořadové číslo musí být větší než 0" })
    .transform((value) => value.toString()),
  releasedAt: z
    .string({ message: "Datum vydání je povinný" })
    .date("Datum vydání musí být ve formátu dd.mm.yyyy"),
  cover: z
    .instanceof(File, { message: "Obálka je povinná" })
    .refine(
      (file) => file.type.startsWith("image/"),
      "Formát souboru není podporován"
    )
    .refine(
      (file) => {
        return file.size <= MAX_COVER_UPLOAD_SIZE
      },
      { message: "Obálka by měla mít maximální velikost 5 MB" }
    ),
  pdf: z
    .instanceof(File, { message: "PDF soubor je povinný" })
    .refine((file) => file.type === "application/pdf", {
      message: "Formát souboru není podporován",
    })
    .refine(
      (file) => {
        return file.size <= MAX_PDF_UPLOAD_SIZE
      },
      { message: "PDF soubor by měl mít maximální velikost 10 MB" }
    ),
  authorId: z.string({ message: "Autor je povinný" }),
})
