import { z } from "zod"

export const schema = z
  .object({
    email: z.string().email(),
    name: z.string().min(3).max(30),
    password: z.string().min(8).optional(),
    passwordConfirmation: z.string().min(8).optional(),
    roleId: z.string(),
    userId: z.string().readonly(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Hesla se neshodují",
  })
