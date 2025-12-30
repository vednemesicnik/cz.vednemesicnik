import { ContentState } from '@generated/prisma/enums'
import { z } from 'zod'
import { featuredImageSchema } from '~/config/featured-image-config'
import { slugify } from '~/utils/slugify'

export const schema = z.object({
  authorId: z.string(),
  categoryIds: z.array(z.string()).optional(),
  content: z.string({ message: 'Obsah je povinný' }),
  existingImages: z
    .array(
      z.object({
        altText: z.string().min(1, 'Alt text je povinný'),
        description: z.string().optional(),
        file: z
          .instanceof(File)
          .refine((f) => f.size === 0 || f.type.startsWith('image/'), {
            message: 'Neplatný formát souboru',
          })
          .refine((f) => f.size === 0 || f.size <= 1024 * 5000, {
            message: 'Maximální velikost souboru je 5000 kB',
          })
          .optional(),
        id: z.string(),
      }),
    )
    .optional(),
  featuredImage: featuredImageSchema,
  images: z
    .array(
      z.object({
        altText: z.string().min(1, 'Alt text je povinný'),
        description: z.string().optional(),
        file: z
          .instanceof(File)
          .refine((f) => f.type.startsWith('image/'), {
            message: 'Neplatný formát souboru',
          })
          .refine((f) => f.size <= 1024 * 5000, {
            message: 'Maximální velikost souboru je 5000 kB',
          }),
      }),
    )
    .optional(),
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
