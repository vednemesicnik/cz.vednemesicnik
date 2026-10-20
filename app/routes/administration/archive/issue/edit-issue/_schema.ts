import { z } from 'zod'

import { slugify } from '~/utils/slugify'

// A draft saves incomplete (design 26e): a missing year or order is said at
// submit, so a field is refused only for a value that can't be read (copy
// xrtebq3m).
const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() ?? '')

/** The fields that make the issue's number; they save as one (decision 0032). */
export const ISSUE_NUMBER_FIELDS = ['year', 'order', 'supplement'] as const

export const schema = z.object({
  // Sent only by the Coordinator, who chooses the author (design 26c).
  authorId: z.string().min(1).optional(),
  // The editor's tab, which holds the edit hold (design 24g).
  editTabId: z.string().min(1),
  name: optionalText,
  order: z
    .number({ message: 'Zadejte pořadí jako celé číslo.' })
    .int({ message: 'Zadejte pořadí jako celé číslo.' })
    .min(1, { message: 'Zadejte pořadí větší než nula.' })
    .optional(),
  supplement: optionalText.refine(
    (value) => value === '' || slugify(value) !== '',
    {
      message: 'Zadejte název doplňku alespoň s jedním písmenem nebo číslicí.',
    },
  ),
  year: z
    .number({ message: 'Zadejte rok čtyřmi číslicemi.' })
    // One check, so 26,5 gets the sentence once.
    .refine(
      (value) => Number.isInteger(value) && value >= 1000 && value <= 9999,
      { message: 'Zadejte rok čtyřmi číslicemi.' },
    )
    .optional(),
})
