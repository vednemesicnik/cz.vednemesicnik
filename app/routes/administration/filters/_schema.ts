import { FilterTable } from '@generated/prisma/enums'
import { z } from 'zod'

import { FORM_CONFIG } from '~/config/form-config'

const INTENT_VALUE = FORM_CONFIG.intent.value

const idField = z.string({ message: 'Filtr je povinný' }).min(1)

// Trimmed before the length checks so " Můj filtr" collides with "Můj filtr" on
// the unique index instead of creating a second, visually identical preset.
const nameField = z
  .string({ message: 'Název je povinný' })
  .trim()
  .min(1, { message: 'Název je povinný' })
  .max(50, { message: 'Název může mít maximálně 50 znaků' })

// Bounded so a forged payload cannot hand URLSearchParams a huge string; the
// canonical form of any real filter is a few dozen characters.
const queryField = z.string().max(500)

// Conform coerces a boolean from the literal "on" only — anything else fails
// validation, so these must be submitted by real checkboxes.
const checkboxField = z.boolean().optional()

// The two intents driven by a Conform form are exported on their own: `useForm`
// needs a single object schema to infer field names from, and the client must
// validate against the very same rules the action applies.
export const createFilterSchema = z.object({
  intent: z.literal(INTENT_VALUE.createFilter),
  isDefault: checkboxField,
  isShared: checkboxField,
  name: nameField,
  query: queryField,
  tableKey: z.enum(FilterTable),
})

export const renameFilterSchema = z.object({
  id: idField,
  intent: z.literal(INTENT_VALUE.renameFilter),
  name: nameField,
})

export const schema = z.discriminatedUnion('intent', [
  createFilterSchema,
  renameFilterSchema,
  z.object({
    id: idField,
    intent: z.literal(INTENT_VALUE.overwriteFilter),
    query: queryField,
  }),
  z.object({
    id: idField,
    intent: z.literal(INTENT_VALUE.deleteFilter),
  }),
  z.object({
    id: idField,
    intent: z.literal(INTENT_VALUE.setDefaultFilter),
  }),
  z.object({
    id: idField,
    intent: z.literal(INTENT_VALUE.unsetDefaultFilter),
  }),
  z.object({
    id: idField,
    intent: z.literal(INTENT_VALUE.toggleSharedFilter),
  }),
])
