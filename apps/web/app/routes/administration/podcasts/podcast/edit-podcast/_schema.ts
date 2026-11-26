import { z } from 'zod'

import { slugify } from '~/utils/slugify'

// A draft saves incomplete (design 27e, 27i): what is missing is said at
// submit, so no field is refused here.
const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() ?? '')

export const schema = z.object({
  // Sent only by the Coordinator, who chooses the author (design 27e, as 25c).
  authorId: z.string().min(1).optional(),
  description: optionalText,
  // The editor's tab, which holds the edit hold (design 24g).
  editTabId: z.string().min(1),
  slug: optionalText.transform(slugify),
  title: optionalText,
})
