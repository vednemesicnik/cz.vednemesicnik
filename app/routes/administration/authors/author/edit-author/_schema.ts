import { z } from 'zod'

export const schema = z.object({
  authorId: z.string().readonly(),
  bio: z
    .string()
    .max(500, { message: 'Bio může mít maximálně 500 znaků' })
    .optional(),
  name: z
    .string({ required_error: 'Jméno je povinné' })
    .min(2, { message: 'Jméno musí mít alespoň 2 znaky' })
    .max(100, { message: 'Jméno může mít maximálně 100 znaků' }),
  roleId: z.string({ required_error: 'Role je povinná' }),
})
