import { z } from "zod"

export const schema = z
  .object({
    email: z
      .string({ required_error: "E-mail je povinný" })
      .email({ message: "Neplatný formát e-mailu" }),
    name: z
      .string({ required_error: "Jméno je povinné" })
      .min(3, { message: "Jméno musí mít alespoň 3 znaky" })
      .max(30, { message: "Jméno může mít maximálně 30 znaků" }),
    password: z
      .string()
      .min(8, { message: "Heslo musí mít alespoň 8 znaků" })
      .optional(),
    passwordConfirmation: z
      .string()
      .min(8, { message: "Potvrzení hesla musí mít alespoň 8 znaků" })
      .optional(),
    roleId: z.string({ required_error: "Role je povinná" }),
    userId: z.string().readonly(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Hesla se neshodují",
    path: ["passwordConfirmation"],
  })
