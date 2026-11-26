import { ALLOWED_EMAIL_DOMAIN } from '@constants/auth'
import { z } from 'zod'

export const schema = z.object({
  email: z
    .string({ message: 'E-mail musí být vyplněn.' })
    .email({ message: 'E-mail musí být ve správném formátu.' })
    // The domain is no secret, so the field says it at once and nothing is
    // sent (design 20b, copy gs905c2e).
    .refine(
      (email) =>
        email.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`),
      {
        message: `Zadejte adresu @${ALLOWED_EMAIL_DOMAIN} — jinou adresou se přihlásit nelze.`,
      },
    ),
})
