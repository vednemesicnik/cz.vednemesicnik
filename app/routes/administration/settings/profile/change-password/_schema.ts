import { z } from 'zod'

// TODO: change minimum password length to 8
export const schema = z
  .object({
    newPassword: z
      .string({
        required_error: 'Heslo je povinné',
      })
      .min(5, {
        message: 'Heslo musí mít alespoň 5 znaků',
      }),
    newPasswordConfirmation: z
      .string({
        required_error: 'Potvrzení hesla je povinné',
      })
      .min(5, {
        message: 'Potvrzení hesla musí mít alespoň 5 znaků',
      }),
    userId: z.string(),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirmation, {
    message: 'Hesla se neshodují',
    path: ['newPasswordConfirmation'],
  })
