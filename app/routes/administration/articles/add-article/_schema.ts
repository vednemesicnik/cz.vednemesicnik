import { z } from 'zod'

import { slugify } from '~/utils/slugify'

export const schema = z.object({
  authorId: z.string({ message: 'Autor je povinný' }),
  categoryIds: z.array(z.string()).optional(),
  content: z.string({ message: 'Obsah je povinný' }),
  featuredImageIndex: z.coerce.number().optional(),
  images: z
    .array(z.instanceof(File))
    .optional()
    .refine(
      (files) => !files || files.every((f) => f.type.startsWith('image/')),
      {
        message: 'Neplatný formát souboru',
      },
    )
    .refine((files) => !files || files.every((f) => f.size <= 1024 * 5000), {
      message: 'Maximální velikost souboru je 5000 kB',
    }),
  slug: z
    .string({ message: 'Slug je povinný' })
    .regex(/^\S/, 'Slug nemůže začínat mezerou')
    .regex(/^[^-]/, 'Slug nemůže začínat pomlčkou')
    .transform(slugify),
  tagIds: z.array(z.string()).optional(),
  title: z
    .string({ message: 'Název je povinný' })
    .regex(/^\S/, 'Název nemůže začínat mezerou'),
})
