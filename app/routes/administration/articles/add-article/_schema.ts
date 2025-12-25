import { z } from 'zod'

import { slugify } from '~/utils/slugify'

export const schema = z.object({
  authorId: z.string(),
  categoryIds: z.array(z.string()).optional(),
  content: z
    .string({ message: 'Content is required' })
    .min(1, 'Content is required')
    .transform((val) => {
      try {
        return JSON.parse(val)
      } catch {
        throw new Error('Invalid JSON content')
      }
    }),
  slug: z
    .string({ message: 'Slug is required' })
    .regex(/^\S/, 'Slug cannot start with a space')
    .regex(/^[^-]/, 'Slug cannot start with a hyphen')
    .transform(slugify),
  tagIds: z.array(z.string()).optional(),
  title: z
    .string({ message: 'Title is required' })
    .regex(/^\S/, 'Title cannot start with a space'),
})
