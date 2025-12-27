import { ContentState } from '@generated/prisma/enums'
import { z } from 'zod'
import { slugify } from '~/utils/slugify'

export const schema = z.object({
  authorId: z.string(),
  categoryIds: z.array(z.string()).optional(),
  content: z.string({ message: 'Obsah je povinný' }),
  featuredImageId: z.string().optional(),
  imagesToDelete: z.array(z.string()).optional(),
  newFeaturedImageIndex: z.coerce.number().optional(),
  newImages: z
    .array(z.instanceof(File))
    .optional()
    .refine(
      (files) => !files || files.every((f) => f.type.startsWith('image/')),
      {
        message: 'Neplatný formát souboru',
      },
    )
    .refine((files) => !files || files.every((f) => f.size <= 1024 * 500), {
      message: 'Maximální velikost souboru je 500 kB',
    }),
  slug: z
    .string({ message: 'Slug je povinný' })
    .regex(/^\S/, 'Slug nemůže začínat mezerou')
    .regex(/^[^-]/, 'Slug nemůže začínat pomlčkou')
    .transform(slugify),
  state: z.enum(ContentState),
  tagIds: z.array(z.string()).optional(),
  title: z
    .string({ message: 'Název je povinný' })
    .regex(/^\S/, 'Název nemůže začínat mezerou'),
})
