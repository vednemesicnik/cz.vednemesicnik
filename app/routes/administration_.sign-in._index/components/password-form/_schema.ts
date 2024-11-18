import { z } from "zod"

export const schema = z.object({
  email: z
    .string({ message: "E-mail musí být vyplněn." })
    .email({ message: "E-mail musí být ve správném formátu." }),
  password: z.string({ message: "Heslo musí být vyplněno." }),
})
