import { ContentState } from '@generated/prisma/enums'
import { z } from 'zod'
import { slugify } from '~/utils/slugify'

export const schema = z.object({
  authorId: z.string(),
  name: z
    .string({ message: 'Name is required' })
    .regex(/^\S/, 'Name cannot start with a space'),
  slug: z
    .string({ message: 'Slug is required' })
    .regex(/^\S/, 'Slug cannot start with a space')
    .regex(/^[^-]/, 'Slug cannot start with a hyphen')
    .transform(slugify),
  state: z.nativeEnum(ContentState),
})
