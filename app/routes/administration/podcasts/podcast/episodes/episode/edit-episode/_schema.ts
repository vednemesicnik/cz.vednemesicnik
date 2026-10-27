import { z } from 'zod'

import { slugify } from '~/utils/slugify'

// A draft saves incomplete (design 27d, 27h): what is missing is said at
// submit, so a field is refused only for a value that can't be read (copy
// ahizoh4o).
const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() ?? '')

/** The sentence for a number that can't be read (copy ahizoh4o). */
export const UNREADABLE_NUMBER_MESSAGE = 'Zadejte celé číslo větší než nula.'

export const schema = z.object({
  // Sent only by the Coordinator, who chooses the author (design 27d, as 25c).
  authorId: z.string().min(1).optional(),
  description: optionalText,
  // The editor's tab, which holds the edit hold (design 24g).
  editTabId: z.string().min(1),
  // A link saves as typed, without its label or with an invalid address
  // (2o0uwhgp); the editor's own schema says what is wrong at the field.
  links: z
    .array(z.object({ label: optionalText, url: optionalText }))
    .optional(),
  number: z
    .number({ message: UNREADABLE_NUMBER_MESSAGE })
    .int({ message: UNREADABLE_NUMBER_MESSAGE })
    .min(1, { message: UNREADABLE_NUMBER_MESSAGE })
    .optional(),
  slug: optionalText.transform(slugify),
  title: optionalText,
})
