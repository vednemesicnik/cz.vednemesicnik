import { z } from 'zod'
import { featuredImageSchema } from '~/config/featured-image-config'
import { slugify } from '~/utils/slugify'

// A draft saves incomplete (design 24d): what is missing is said on submit and
// publish (23h), so a field is only trimmed, never refused for being empty.
const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() ?? '')

export const schema = z.object({
  authorIds: z
    .array(z.string({ error: 'Vyberte autora' }))
    .min(1, 'Alespoň jeden autor je povinný'),
  categoryIds: z.array(z.string()).optional(),
  content: optionalText,
  // The editor's tab, which holds the edit hold (design 24g).
  editTabId: z.string().min(1),
  excerpt: optionalText,
  existingImages: z
    .array(
      z.object({
        altText: optionalText,
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
  // A new image's id is made in the editor, so a repeated save stores it
  // once; its file goes only until a save has it (decision 0022).
  images: z
    .array(
      z.object({
        altText: optionalText,
        description: z.string().optional(),
        file: z
          .instanceof(File)
          .refine((f) => f.size === 0 || f.type.startsWith('image/'), {
            message: 'Neplatný formát souboru',
          })
          .refine((f) => f.size <= 1024 * 5000, {
            message: 'Maximální velikost souboru je 5000 kB',
          })
          .optional(),
        id: z.string().min(1),
      }),
    )
    .optional(),
  slug: optionalText.transform(slugify),
  tagIds: z.array(z.string()).optional(),
  title: optionalText,
})
