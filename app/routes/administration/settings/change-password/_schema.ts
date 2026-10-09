import { z } from 'zod'

export const schema = z
  .object({
    newPassword: z.string({ message: 'Heslo je povinné' }).min(8, {
      message: 'Heslo musí mít alespoň 8 znaků',
    }),
    newPasswordConfirmation: z
      .string({ message: 'Potvrzení hesla je povinné' })
      .min(8, { message: 'Potvrzení hesla musí mít alespoň 8 znaků' }),
    userId: z.string(),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirmation, {
    message: 'Hesla se neshodují',
    path: ['newPasswordConfirmation'],
  })
