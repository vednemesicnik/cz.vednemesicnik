import { z } from 'zod'
import { slugify } from '~/utils/slugify'

// A draft saves incomplete (design 24d): what is missing is said on submit and
// publish (23h), so a field is only trimmed, never refused for being empty.
const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() ?? '')

export const schema = z.object({
  // An article always has an author, a draft too (design 24j).
  authorIds: z
    .array(z.string().min(1))
    .min(1, 'Alespoň jeden autor je povinný'),
  categoryIds: z.array(z.string()).optional(),
  content: optionalText,
  // The editor's tab, which holds the edit hold (design 24g).
  editTabId: z.string().min(1),
  // The gallery's alt texts and captions; every image change saves on its
  // own (design 24b, log 0027).
  images: z
    .array(
      z.object({
        altText: optionalText,
        description: z.string().optional(),
        id: z.string().min(1),
      }),
    )
    .optional(),
  perex: optionalText,
  // The links the editor had at open and no longer has; any other stored
  // link stays, an archived one included (log 0025).
  removedCategoryIds: z.array(z.string()).optional(),
  removedTagIds: z.array(z.string()).optional(),
  slug: optionalText.transform(slugify),
  tagIds: z.array(z.string()).optional(),
  title: optionalText,
})
