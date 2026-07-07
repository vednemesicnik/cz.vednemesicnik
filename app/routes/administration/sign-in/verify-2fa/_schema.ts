import { z } from 'zod'

// The verify step accepts either a 6-digit TOTP or a backup code (xxxx-xxxx).
// Exactly one field is submitted — the sign-in form toggles which input is
// shown — and the action branches on whichever is present.
export const schema = z
  .object({
    backupCode: z
      .string()
      // Validate against the canonical form (separators stripped, see
      // canonicalizeBackupCode) so anything that redeems — with or without the
      // dash, or transcribed with spaces — also passes validation.
      .refine((value) => value.replace(/[^a-z0-9]/gi, '').length === 8, {
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
      // Only one field is rendered at a time, so attach the required error to
      // both — whichever input is visible then shows it (the hidden one's copy
      // is simply not rendered).
      for (const path of ['code', 'backupCode'] as const) {
        ctx.addIssue({
          code: 'custom',
          message: 'Ověřovací kód musí být vyplněn.',
          path: [path],
        })
      }
    }
  })
