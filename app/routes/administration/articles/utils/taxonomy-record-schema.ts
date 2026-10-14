import { z } from 'zod'

import { FORM_CONFIG } from '~/config/form-config'
import { slugify } from '~/utils/slugify'

const INTENT_VALUE = FORM_CONFIG.intent.value

/**
 * A category's or tag's fields on its add and edit pages (design 25c). The address is
 * corrected, not rejected: a leading space or hyphen is dropped. `authorId` is
 * sent by the Coordinator only; for other roles the server sets the author.
 */
export const taxonomyRecordSchema = z.object({
  authorId: z.string().optional(),
  name: z.string({ message: 'Doplňte název.' }).trim().min(1, 'Doplňte název.'),
  slug: z
    .string({ message: 'Doplňte adresu.' })
    .transform(slugify)
    .refine((slug) => slug !== '', 'Doplňte adresu.'),
})

/** The add page's fields with the button that saved them (design 25c). */
export const newTaxonomyRecordSchema = taxonomyRecordSchema.extend({
  intent: z.enum([
    INTENT_VALUE.saveDraft,
    INTENT_VALUE.publish,
    INTENT_VALUE.submitForReview,
  ]),
})
