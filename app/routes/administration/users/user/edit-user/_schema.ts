import { z } from 'zod'

// No name and no password (design 28f): the name belongs to the author, and
// whoever forgets a password signs in with a link.
export const schema = z.object({
  email: z
    .string({ message: 'E-mail je povinný' })
    .trim()
    .toLowerCase()
    .email({ message: 'Neplatný formát e-mailu' }),
  roleId: z.string({ message: 'Role je povinná' }),
  userId: z.string().readonly(),
})
