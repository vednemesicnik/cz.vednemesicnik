import { z } from 'zod'

import { DONATION_FIELD_LIMITS as LIMITS } from '~/config/donation-request-config'

const email = z
  .email({ error: 'E-mail nemá platný formát.' })
  .max(LIMITS.email, { error: 'E-mail je příliš dlouhý.' })

const accounts = z
  .array(
    z
      .string({ error: 'Vyplňte prosím číslo účtu.' })
      .trim()
      .regex(/^[\d\-/]+$/, {
        error: 'Číslo účtu může obsahovat pouze číslice a lomítko.',
      })
      .max(LIMITS.accountLength, { error: 'Číslo účtu je příliš dlouhé.' }),
  )
  .max(LIMITS.accounts, {
    error: `Uveďte nejvýš ${LIMITS.accounts} účtů.`,
  })

const note = z
  .string()
  .trim()
  .max(LIMITS.note, {
    error: `Doplňující informace mohou mít nejvýš ${LIMITS.note} znaků.`,
  })
  .optional()

const year = z
  .string({ error: 'Vyberte rok, za který žádáte o potvrzení.' })
  .refine(
    (value) =>
      [1, 2, 3]
        .map((offset) => String(new Date().getFullYear() - offset))
        .includes(value),
    { error: 'Vyberte rok, za který žádáte o potvrzení.' },
  )

const tooLong = (maxLength: number) =>
  `Zkraťte prosím údaj na ${maxLength} znaků.`

const firstName = z
  .string({ error: 'Vyplňte prosím jméno.' })
  .trim()
  .min(1)
  .max(LIMITS.name, { error: tooLong(LIMITS.name) })

const lastName = z
  .string({ error: 'Vyplňte prosím příjmení.' })
  .trim()
  .min(1)
  .max(LIMITS.name, { error: tooLong(LIMITS.name) })

const address = z.object({
  city: z
    .string({ error: 'Vyplňte prosím obec.' })
    .trim()
    .min(1)
    .max(LIMITS.city, { error: tooLong(LIMITS.city) }),
  street: z
    .string({ error: 'Vyplňte prosím ulici a číslo.' })
    .trim()
    .min(1)
    .max(LIMITS.street, { error: tooLong(LIMITS.street) }),
  zip: z
    .string({ error: 'Vyplňte prosím PSČ.' })
    .regex(/^\d{3} ?\d{2}$/, { error: 'PSČ nemá platný formát.' }),
})

const dateOfBirth = z
  .string({ error: 'Vyplňte prosím datum narození.' })
  .trim()
  .transform((value, ctx) => {
    const match = value.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/)
    if (!match) {
      ctx.addIssue({
        code: 'custom',
        message: 'Zadejte datum ve tvaru DD.MM.RRRR.',
      })
      return z.NEVER
    }
    const day = Number(match[1])
    const month = Number(match[2])
    const yr = Number(match[3])
    const date = new Date(yr, month - 1, day)
    const isReal =
      date.getFullYear() === yr &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    if (!isReal) {
      ctx.addIssue({ code: 'custom', message: 'Toto datum neexistuje.' })
      return z.NEVER
    }
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(day)}.${pad(month)}.${yr}`
  })

const common = {
  accounts,
  address,
  email,
  note,
  year,
}

const individual = z.object({
  ...common,
  dateOfBirth,
  firstName,
  lastName,
  type: z.literal('individual'),
})

const soleTrader = z.object({
  ...common,
  firstName,
  ico: z
    .string({ error: 'Vyplňte prosím IČO.' })
    .regex(/^\d{8}$/, { error: 'IČO musí mít 8 číslic.' }),
  lastName,
  type: z.literal('sole_trader'),
})

const entity = z.object({
  ...common,
  companyName: z
    .string({ error: 'Vyplňte prosím název firmy.' })
    .trim()
    .min(1)
    .max(LIMITS.companyName, { error: tooLong(LIMITS.companyName) }),
  ico: z
    .string({ error: 'Vyplňte prosím IČO.' })
    .regex(/^\d{8}$/, { error: 'IČO musí mít 8 číslic.' }),
  type: z.literal('entity'),
})

export const schema = z.discriminatedUnion('type', [
  individual,
  soleTrader,
  entity,
])
