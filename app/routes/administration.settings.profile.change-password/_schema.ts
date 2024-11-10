import { z } from "zod"

// TODO: change minimum password length to 8
export const schema = z
  .object({
    userId: z.string(),
    newPassword: z
      .string({
        message: "Password is required",
      })
      .min(5, {
        message: "Password must be at least 5 characters long",
      }),
    newPasswordConfirmation: z
      .string({
        message: "Password confirmation is required",
      })
      .min(5, {
        message: "Password confirmation must be at least 5 characters long",
      }),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirmation, {
    message: "Passwords do not match",
    path: ["newPasswordConfirmation"],
  })
