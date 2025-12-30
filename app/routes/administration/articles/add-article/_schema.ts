import { z } from 'zod'

import { featuredImageSchema } from '~/config/featured-image-config'
import { slugify } from '~/utils/slugify'

const newImageSchema = z.object({
  altText: z.string({ error: 'Alt text je povinný' }),
  description: z.string().optional(),
  file: z
    .instanceof(File)
    .refine((file) => file.type.startsWith('image/'), {
      error: 'Neplatný formát souboru',
    })
    .refine((file) => file.size <= 1024 * 5000, {
      error: 'Maximální velikost souboru je 5000 kB',
    }),
})

export const schema = z.object({
  authorId: z.string({ error: 'Autor je povinný' }),
  categoryIds: z.array(z.string()).optional(),
  content: z.string({ error: 'Obsah je povinný' }),
  featuredImage: featuredImageSchema,
  images: z.array(newImageSchema).optional(),
  slug: z
    .string({ error: 'Slug je povinný' })
    .regex(/^\S/, { error: 'Slug nemůže začínat mezerou' })
    .regex(/^[^-]/, { error: 'Slug nemůže začínat pomlčkou' })
    .transform(slugify),
  tagIds: z.array(z.string()).optional(),
  title: z
    .string({ error: 'Název je povinný' })
    .regex(/^\S/, { error: 'Název nemůže začínat mezerou' }),
})
