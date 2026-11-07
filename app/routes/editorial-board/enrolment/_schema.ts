import { z } from 'zod'

import { membershipDetailsSchema } from '~/utils/membership-application/membership-details-schema'

// The script's limits (schemas/editorial-board-membership). What it refuses arrives
// only after the person confirmed by e-mail, with no way out, so the form says it
// first. `enrol` takes one name of 100 characters: 49 each and the space between.
const MAX_NAME_LENGTH = 49
const MAX_INTEREST_LENGTH = 2000
// Toolkit.isSingleLineName: no second line, no address and no link.
const NOT_A_NAME = /[\r\n\u2028\u2029]|@|:\/\/|www\.|https?:/i

const createNameSchema = (messages: {
  empty: string
  notAName: string
  tooLong: string
}) =>
  z
    .string({ message: messages.empty })
    .trim()
    .min(1, { message: messages.empty })
    .max(MAX_NAME_LENGTH, { message: messages.tooLong })
    .refine((value) => !NOT_A_NAME.test(value), { message: messages.notAName })

/** What someone leaves on the form from the leaflet (design 15e). */
export const enrolmentSchema = membershipDetailsSchema
  .pick({ email: true })
  .extend({
    firstName: createNameSchema({
      empty: 'Vyplňte jméno.',
      notAName: 'Zadejte jméno bez e-mailové adresy nebo odkazu.',
      tooLong: `Zkraťte jméno na nejvýš ${MAX_NAME_LENGTH} znaků.`,
    }),
    interest: z
      .string()
      .trim()
      .max(MAX_INTEREST_LENGTH, {
        message: 'Zkraťte text na nejvýš 2\u00A0000 znaků.',
      })
      .transform((value) => (value === '' ? undefined : value))
      .optional(),
    lastName: createNameSchema({
      empty: 'Vyplňte příjmení.',
      notAName: 'Zadejte příjmení bez e-mailové adresy nebo odkazu.',
      tooLong: `Zkraťte příjmení na nejvýš ${MAX_NAME_LENGTH} znaků.`,
    }),
    // Required here, optional in the membership application and in the script's
    // contract; the format is the shared one.
    phone: z
      .string({ message: 'Vyplňte telefon.' })
      .trim()
      .min(1, { message: 'Vyplňte telefon.' })
      .pipe(membershipDetailsSchema.shape.phone.unwrap()),
  })
