import { ContentState } from '@generated/prisma/enums'
import { z } from 'zod'
import { isValidJson } from '~/utils/is-valid-json'
import { slugify } from '~/utils/slugify'

export const schema = z.object({
  authorId: z.string(),
  categoryIds: z.array(z.string()).optional(),
  content: z
    .string({ message: 'Obsah je povinný' })
    .refine(isValidJson, { message: 'Obsah není validní JSON' }),
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
