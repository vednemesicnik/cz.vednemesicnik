import { z } from 'zod'

// Mirrors CODE_ALPHABET in backup-codes.server.ts (kept inline so this schema
// stays client-safe and never imports the server module). Only 8 chars from the
// unambiguous alphabet form a real code.
const BACKUP_CODE_CANONICAL = /^[23456789abcdefghjkmnpqrstuvwxyz]{8}$/

// The verify step accepts either a 6-digit TOTP or a backup code (xxxx-xxxx).
// Exactly one field is submitted — the sign-in form toggles which input is
// shown — and the action branches on whichever is present.
export const schema = z
  .object({
    backupCode: z
      .string()
      // Validate the canonical form (separators stripped, see
      // canonicalizeBackupCode) so anything that redeems — with or without the
      // dash, or transcribed with spaces — passes, while rejecting characters
      // outside the generation alphabet before they hit redemption.
      .refine(
        (value) =>
          BACKUP_CODE_CANONICAL.test(
            value.toLowerCase().replace(/[^a-z0-9]/g, ''),
          ),
        { message: 'Zadejte platný záložní kód (např. k7m2-9xqp).' },
      )
      .optional(),
    code: z
      .string()
      .regex(/^\d{6}$/, { message: 'Kód musí obsahovat 6 číslic.' })
      .optional(),
  })
  .superRefine((value, ctx) => {
    const hasCode = value.code !== undefined
    const hasBackupCode = value.backupCode !== undefined

    // The UI only ever renders one field, so exactly one must be present.
    // Attach the error to both paths — whichever input is visible then shows it
    // (the hidden one's copy is simply not rendered). Enforcing this here also
    // keeps a crafted request that sends both from silently picking a branch.
    if (hasCode === hasBackupCode) {
      const message = hasCode
        ? 'Zadejte pouze jeden kód.'
        : 'Ověřovací kód musí být vyplněn.'

      for (const path of ['code', 'backupCode'] as const) {
        ctx.addIssue({ code: 'custom', message, path: [path] })
      }
    }
  })
