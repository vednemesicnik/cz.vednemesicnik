import type { AuthLogEvent, AuthMethod } from '@generated/prisma/enums'

import { formatNumericDateTime } from '~/utils/format-numeric-date-time'

export type SignInAttempt = {
  id: string
  dateTime: string
  formattedDateTime: string
  label: string
  isFailure: boolean
}

type AuthLogRow = {
  id: string
  createdAt: Date
  event: AuthLogEvent
  method: AuthMethod | null
}

// Approved copy (0camiulr).
const methodLabels: Record<AuthMethod, string> = {
  backup_code: 'Záložní kód',
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
 * @returns The attempt with its ISO time, formatted time and label, or `null`
 *   for a row without a method (a sign-out).
 */
export const toSignInAttempt = (row: AuthLogRow): SignInAttempt | null => {
  if (row.method === null) return null

  const isFailure = row.event !== 'sign_in_success'
  const methodLabel = methodLabels[row.method]

  return {
    dateTime: row.createdAt.toISOString(),
    formattedDateTime: formatNumericDateTime(row.createdAt),
    id: row.id,
    isFailure,
    // A no-break space before the dash: a line never starts with it.
    label: isFailure ? `${methodLabel} — neúspěšný pokus` : methodLabel,
  }
}
