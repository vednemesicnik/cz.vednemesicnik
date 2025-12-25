import { z } from 'zod'

import { slugify } from '~/utils/slugify'

export const schema = z.object({
  authorId: z.string(),
  categoryIds: z.array(z.string()).optional(),
  content: z.string({ message: 'Obsah je povinný' }).transform((val) => {
    try {
      return JSON.parse(val)
    } catch {
      throw new Error('Invalid JSON content')
    }
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
