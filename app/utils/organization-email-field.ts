import { ALLOWED_EMAIL_DOMAIN } from '@constants/auth'
import { z } from 'zod'

/**
 * An account's e-mail, as add-user and edit-user take it (design 28f): trimmed,
 * lower-cased and on the organisation's domain, since sign-in by link and
 * Google accept no other (9gdcrwph). One message at a time — the missing `@`,
 * then the format, then the domain.
 */
export const organizationEmailField = z
  .string({ message: 'E-mail je povinný' })
  .trim()
  .toLowerCase()
  .refine((email) => email.includes('@'), {
    abort: true,
    message: 'Doplňte do e-mailu zavináč.',
  })
  .email({ abort: true, message: 'Neplatný formát e-mailu' })
  .refine((email) => email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`), {
    message: `Zadejte adresu s doménou @${ALLOWED_EMAIL_DOMAIN}.`,
  })
