import { z } from 'zod'

import { slugify } from '~/utils/slugify'

const MAX_COVER_UPLOAD_SIZE = 1024 * 1024 * 5 // 5 MB
const MAX_PDF_UPLOAD_SIZE = 1024 * 1024 * 10 // 10 MB

export const schema = z.object({
  authorId: z.string({ message: 'Autor je povinný' }),
  cover: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || file.type.startsWith('image/'),
      'Formát souboru není podporován',
    )
    .refine((file) => !file || file.size <= MAX_COVER_UPLOAD_SIZE, {
      message: 'Obálka by měla mít maximální velikost 5 MB',
    }),
  coverId: z.string().readonly(),
  id: z.string(),
  name: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  order: z
    .number({ message: 'Zadejte pořadí v roce.' })
    .int({ message: 'Zadejte pořadí jako celé číslo.' })
    .min(1, { message: 'Zadejte pořadí větší než nula.' }),
  pdf: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.type === 'application/pdf', {
      message: 'Formát souboru není podporován',
    })
    .refine(
      (file) => {
        return !file || file.size <= MAX_PDF_UPLOAD_SIZE
      },
      { message: 'PDF soubor by měl mít maximální velikost 10 MB' },
    ),
  pdfId: z.string().readonly(),
  supplement: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => value === undefined || slugify(value) !== '', {
      message: 'Zadejte název doplňku alespoň s jedním písmenem nebo číslicí.',
    }),
  year: z
    .number({ message: 'Zadejte rok.' })
    // One check, so 26,5 gets the sentence once.
    .refine(
      (value) => Number.isInteger(value) && value >= 1000 && value <= 9999,
      { message: 'Zadejte rok čtyřmi číslicemi.' },
    ),
})
