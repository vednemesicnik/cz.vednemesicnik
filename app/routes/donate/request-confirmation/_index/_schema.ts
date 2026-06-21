import { z } from 'zod'

export const schema = z.object({
  accounts: z.array(z.string({ error: 'Vyplňte prosím číslo účtu.' })),
  city: z.string({ error: 'Vyplňte prosím obec.' }),
  country: z.string({ error: 'Vyplňte prosím stát.' }),
  email: z.email({ error: 'E-mail nemá platný formát.' }),
  fullName: z.string({ error: 'Vyplňte prosím jméno a příjmení.' }),
  note: z.string().optional(),
  postalCode: z
    .string({ error: 'Vyplňte prosím PSČ.' })
    .regex(/^\d{3}\s?\d{2}$/, {
      error: 'PSČ nemá platný formát.',
    }),
  street: z.string({ error: 'Vyplňte prosím ulici a číslo.' }),
})
