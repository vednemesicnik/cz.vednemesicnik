import { z } from 'zod'

import { slugify } from '~/utils/slugify'

export const schema = z.object({
  authorId: z.string(),
  description: z.string({ message: 'Description is required' }),
  episodeId: z.string().readonly(),
  number: z
    .number({ message: '' + 'Episode number is required' })
    .int({ message: 'Episode number must be an integer' })
    .positive({ message: 'Episode number must be a positive number' })
    .min(1),
  podcastId: z.string().readonly(),
  slug: z
    .string({ message: 'Slug is required' })
    .regex(/^\S/, 'Slug cannot start with a space')
    .regex(/^[^-]/, 'Slug cannot start with a hyphen')
    .transform(slugify),
  title: z
    .string({ message: 'Title is required' })
    .regex(/^\S/, 'Title cannot start with a space'),
})
