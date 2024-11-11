import { z } from "zod"

export const schema = z
  .object({
    email: z.string().email(),
    username: z.string().min(3).max(30),
    name: z.string().min(3).max(30),
    password: z.string().min(8),
    passwordConfirmation: z.string().min(8),
    roleId: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Hesla se neshodují",
  })
