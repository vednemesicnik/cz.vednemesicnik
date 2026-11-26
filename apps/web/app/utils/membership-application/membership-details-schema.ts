import { z } from 'zod'

import { getPragueDate } from '~/utils/get-prague-date'

import { parseCzechDate } from './parse-czech-date'

// The script's own limits (SCRIPT__Membership__Applications, config.gs). Its
// refusal of links in a name or an address stays with it: no real one has any,
// and its answer sends the applicant back to check the details.
const MAX_NAME_LENGTH = 100
const MAX_ADDRESS_LENGTH = 300
const PHONE_PATTERN = /^\+?[0-9 ]{9,20}$/

// Longer is no address, and would not fit the cookie.
const MAX_EMAIL_LENGTH = 254
const EMAIL_FORMAT = 'Zadejte e-mail ve tvaru jmeno@priklad.cz.'

/**
 * What an applicant fills in on the first step (design 15d). All of it is
 * required except the phone. The date of birth comes in as written
 * (`14. 5. 2009`) and leaves as `YYYY-MM-DD`.
 */
export const membershipDetailsSchema = z.object({
  address: z
    .string({ message: 'Vyplňte adresu trvalého bydliště.' })
    .trim()
    .min(1, { message: 'Vyplňte adresu trvalého bydliště.' })
    .max(MAX_ADDRESS_LENGTH, {
      message: `Zkraťte adresu na nejvýš ${MAX_ADDRESS_LENGTH} znaků.`,
    }),
  dateOfBirth: z
    .string({ message: 'Vyplňte datum narození.' })
    .transform((value, context) => {
      const date = parseCzechDate(value)

      if (date === null) {
        context.addIssue({
          code: 'custom',
          message: 'Zadejte platné datum, například 14. 5. 2009.',
        })
        return z.NEVER
      }

      if (date > getPragueDate(new Date())) {
        context.addIssue({
          code: 'custom',
          message: 'Datum narození nemůže být v budoucnosti.',
        })
        return z.NEVER
      }

      return date
    }),
  email: z
    .string({ message: 'Vyplňte e-mail.' })
    .trim()
    .max(MAX_EMAIL_LENGTH, { message: EMAIL_FORMAT })
    .email({ message: EMAIL_FORMAT }),
  firstName: z
    .string({ message: 'Vyplňte jméno.' })
    .trim()
    .min(1, { message: 'Vyplňte jméno.' })
    .max(MAX_NAME_LENGTH, {
      message: `Zkraťte jméno na nejvýš ${MAX_NAME_LENGTH} znaků.`,
    }),
  lastName: z
    .string({ message: 'Vyplňte příjmení.' })
    .trim()
    .min(1, { message: 'Vyplňte příjmení.' })
    .max(MAX_NAME_LENGTH, {
      message: `Zkraťte příjmení na nejvýš ${MAX_NAME_LENGTH} znaků.`,
    }),
  phone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, {
      message:
        'Zadejte telefon například ve tvaru 604 123 456 nebo +420 604 123 456.',
    })
    .optional(),
})

export type MembershipDetails = z.output<typeof membershipDetailsSchema>
