import { z } from 'zod'

const baseSchema = z.object({
  email: z
    .string({ message: 'E-mail je povinný' })
    .email({ message: 'Neplatný formát e-mailu' }),
  name: z
    .string({ message: 'Jméno je povinné' })
    .min(3, { message: 'Jméno musí mít alespoň 3 znaky' })
    .max(30, { message: 'Jméno může mít maximálně 30 znaků' }),
  password: z
    .string({ message: 'Heslo je povinné' })
    .min(8, { message: 'Heslo musí mít alespoň 8 znaků' }),
  passwordConfirmation: z
    .string({ message: 'Potvrzení hesla je povinné' })
    .min(8, { message: 'Potvrzení hesla musí mít alespoň 8 znaků' }),
  roleId: z.string({ message: 'Role je povinná' }),
})

export const schema = z
  .discriminatedUnion('authorMode', [
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
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Hesla se neshodují',
    path: ['passwordConfirmation'],
  })
