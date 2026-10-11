import { ALLOWED_EMAIL_DOMAIN } from '@constants/auth'
import { z } from 'zod'

const baseSchema = z.object({
  // Invitations go only to the organisation's domain (design 28f, 9gdcrwph).
  email: z
    .string({ message: 'E-mail je povinný' })
    .trim()
    .toLowerCase()
    .email({ message: 'Neplatný formát e-mailu' })
    .refine((email) => email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`), {
      message: `Zadejte adresu s doménou @${ALLOWED_EMAIL_DOMAIN}.`,
    }),
  name: z
    .string({ message: 'Jméno je povinné' })
    .min(3, { message: 'Jméno musí mít alespoň 3 znaky' })
    .max(30, { message: 'Jméno může mít maximálně 30 znaků' }),
  roleId: z.string({ message: 'Role je povinná' }),
})

export const schema = z.discriminatedUnion('authorMode', [
  baseSchema.extend({
    authorMode: z.literal('new'),
  }),
  baseSchema.extend({
    authorMode: z.literal('existing'),
    existingAuthorId: z.string({
      message: 'Vyberte existujícího autora',
    }),
  }),
])
