import { z } from 'zod'

const email = z.email({ error: 'E-mail nemá platný formát.' })

const accounts = z.array(
  z
    .string({ error: 'Vyplňte prosím číslo účtu.' })
    .trim()
    .regex(/^[\d\-/]+$/, {
      error: 'Číslo účtu může obsahovat pouze číslice a lomítko.',
    }),
)

const note = z.string().trim().optional()

const year = z
  .string({ error: 'Vyberte rok, za který žádáte o potvrzení.' })
  .refine(
    (value) =>
      [1, 2, 3]
        .map((offset) => String(new Date().getFullYear() - offset))
        .includes(value),
    { error: 'Vyberte rok, za který žádáte o potvrzení.' },
  )

const address = z.object({
  city: z.string({ error: 'Vyplňte prosím obec.' }).trim().min(1),
  street: z.string({ error: 'Vyplňte prosím ulici a číslo.' }).trim().min(1),
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
  firstName: z.string({ error: 'Vyplňte prosím jméno.' }).trim().min(1),
  lastName: z.string({ error: 'Vyplňte prosím příjmení.' }).trim().min(1),
  type: z.literal('individual'),
})

const soleTrader = z.object({
  ...common,
  firstName: z.string({ error: 'Vyplňte prosím jméno.' }).trim().min(1),
  ico: z
    .string({ error: 'Vyplňte prosím IČO.' })
    .regex(/^\d{8}$/, { error: 'IČO musí mít 8 číslic.' }),
  lastName: z.string({ error: 'Vyplňte prosím příjmení.' }).trim().min(1),
  type: z.literal('sole_trader'),
})

const entity = z.object({
  ...common,
  companyName: z.string({ error: 'Vyplňte prosím název firmy.' }).trim().min(1),
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
