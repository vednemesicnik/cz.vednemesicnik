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
      .string({ required_error: "Heslo je povinné" })
      .min(8, { message: "Heslo musí mít alespoň 8 znaků" }),
    passwordConfirmation: z
      .string({ required_error: "Potvrzení hesla je povinné" })
      .min(8, { message: "Potvrzení hesla musí mít alespoň 8 znaků" }),
    roleId: z.string({ required_error: "Role je povinná" }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Hesla se neshodují",
    path: ["passwordConfirmation"],
  })
