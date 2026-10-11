import { z } from 'zod'

export const schema = z.object({
  // The app shows the code in two groups (123 456); accept it typed that way.
  code: z.preprocess(
    (value) => (typeof value === 'string' ? value.replace(/\s/g, '') : value),
    z
      .string({ message: 'Ověřovací kód je povinný' })
      .regex(/^\d{6}$/, { message: 'Kód musí obsahovat 6 číslic' }),
  ),
})
