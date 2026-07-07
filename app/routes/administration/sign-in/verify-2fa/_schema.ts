import { z } from 'zod'

// The verify step accepts either a 6-digit TOTP or a backup code (xxxx-xxxx).
// Exactly one field is submitted — the sign-in form toggles which input is
// shown — and the action branches on whichever is present.
export const schema = z
  .object({
    backupCode: z
      .string()
      .regex(/^[a-z0-9]{4}-?[a-z0-9]{4}$/i, {
        message: 'Zadejte platný záložní kód (např. k7m2-9xqp).',
      })
      .optional(),
    code: z
      .string()
      .regex(/^\d{6}$/, { message: 'Kód musí obsahovat 6 číslic.' })
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.code === undefined && value.backupCode === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Ověřovací kód musí být vyplněn.',
        path: ['code'],
      })
    }
  })
