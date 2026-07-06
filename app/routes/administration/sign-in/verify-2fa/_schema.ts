import { z } from 'zod'

export const schema = z.object({
  code: z
    .string({ message: 'Ověřovací kód musí být vyplněn.' })
    .regex(/^\d{6}$/, { message: 'Kód musí obsahovat 6 číslic.' }),
})
