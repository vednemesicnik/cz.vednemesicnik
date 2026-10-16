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
  // A row added and not chosen yet is no author; at least one stays (#674).
  authorIds: z
    .array(z.string().optional())
    .transform((ids) => ids.filter((id): id is string => Boolean(id)))
    .pipe(z.array(z.string()).min(1, 'Alespoň jeden autor je povinný')),
  categoryIds: z.array(z.string()).optional(),
  content: optionalText,
  // The editor's tab, which holds the edit hold (design 24g).
  editTabId: z.string().min(1),
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
  perex: optionalText,
  // The links the editor had at open and no longer has; any other stored
  // link stays, an archived one included (decision 0025).
  removedCategoryIds: z.array(z.string()).optional(),
  removedTagIds: z.array(z.string()).optional(),
  slug: optionalText.transform(slugify),
  tagIds: z.array(z.string()).optional(),
  title: optionalText,
})
