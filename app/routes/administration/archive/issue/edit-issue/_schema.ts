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
    .number({ message: 'Pořadí je povinné' })
    .int({ message: 'Pořadí musí být celé číslo' })
    .min(1, { message: 'Pořadí musí být větší než 0' }),
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
      message: 'Doplněk musí obsahovat písmeno nebo číslici',
    }),
  year: z
    .number({ message: 'Rok je povinný' })
    .int({ message: 'Rok musí být celé číslo' })
    .min(1000, { message: 'Rok musí mít čtyři číslice' })
    .max(9999, { message: 'Rok musí mít čtyři číslice' }),
})
