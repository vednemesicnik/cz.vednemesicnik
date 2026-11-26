import type { AuthLogEvent, AuthMethod } from '@generated/prisma/enums'

import { formatNumericDateTime } from '~/utils/format-numeric-date-time'

export type SignInAttempt = {
  id: string
  dateTime: string
  formattedDateTime: string
  label: string
  detail: string | null
  isFailure: boolean
}

type AuthLogRow = {
  id: string
  createdAt: Date
  event: AuthLogEvent
  method: AuthMethod | null
}

// Approved copy (0camiulr; Nouzový odkaz n2fjcvyq).
const methodLabels: Record<AuthMethod, string> = {
  backup_code: 'Záložní kód',
  emergency_link: 'Nouzový odkaz',
  google: 'Google',
  magic_link: 'Odkaz v e-mailu',
  passkey: 'Passkey',
  password: 'Heslo',
  two_factor: 'Kód z ověřovací aplikace',
}

/**
 * Turns an `AuthLog` row into a row of the sign-in attempts list (design 29a,
 * 28e): every event other than `sign_in_success` is a failed attempt and says
 * so in words, not by colour alone.
 *
 * @param row - The row's id, time, event and method.
 * @param issuerName - Who issued the emergency link the attempt used, its
 *   line „Odkaz od: …“ under the method (design 28e, n2fjcvyq); `null` without
 *   a link or once the issuer's account is deleted.
 * @returns The attempt with its ISO time, formatted time, label and detail, or
 *   `null` for a row without a method (a sign-out).
 */
export const toSignInAttempt = (
  row: AuthLogRow,
  issuerName: string | null = null,
): SignInAttempt | null => {
  if (row.method === null) return null

  const isFailure = row.event !== 'sign_in_success'
  const methodLabel = methodLabels[row.method]

  return {
    dateTime: row.createdAt.toISOString(),
    detail: issuerName === null ? null : `Odkaz od: ${issuerName}`,
    formattedDateTime: formatNumericDateTime(row.createdAt),
    id: row.id,
    isFailure,
    // A no-break space before the dash: a line never starts with it.
    label: isFailure ? `${methodLabel} — neúspěšný pokus` : methodLabel,
  }
}
