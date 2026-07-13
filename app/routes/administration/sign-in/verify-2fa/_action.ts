import { parseWithZod } from '@conform-to/zod/v4'
import { data, redirect } from 'react-router'
import { setSessionAuthCookieSession } from '~/utils/auth.server'
import { recordAuthLog } from '~/utils/auth-log.server'
import { redeemBackupCode } from '~/utils/backup-codes.server'
import { formatRetryAfter } from '~/utils/format-retry-after'
import { checkHoneypot } from '~/utils/honeypot.server'
import {
  deletePendingTwoFactorCookieSession,
  getPendingTwoFactorAttempts,
  getPendingTwoFactorCookieSession,
  getPendingTwoFactorUserId,
  MAX_TWO_FACTOR_ATTEMPTS,
  setPendingTwoFactorCookieSession,
} from '~/utils/pending-two-factor.server'
import { rateLimitContext } from '~/utils/rate-limit.server'
import { createSession } from '~/utils/session.server'
import { verifyTOTP } from '~/utils/totp.server'
import { getUserTwoFactor } from '~/utils/two-factor.server'

import { schema } from './_schema'
import type { Route } from './+types/route'

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData()

  checkHoneypot(formData)

  const cookieSession = await getPendingTwoFactorCookieSession(request)

  // Any redirect out of the TOTP step clears the pending cookie so no stale
  // pending user id / attempt counter lingers until it expires.
  const redirectToPassword = async () =>
    redirect('/administration/sign-in/password', {
      headers: {
        'Set-Cookie': await deletePendingTwoFactorCookieSession(cookieSession),
      },
      status: 303,
    })

  // Break-glass: the whole password path is gated behind the flag.
  if (process.env.ALLOW_PASSWORD_SIGN_IN !== 'true') {
    throw await redirectToPassword()
  }

  const userId = getPendingTwoFactorUserId(cookieSession)

  // No pending sign-in — restart from the password step.
  if (userId === undefined) {
    throw await redirectToPassword()
  }

  // Rate limited by the middleware (see _middleware.ts): surface an inline error
  // before verifying the code, bounding TOTP / backup-code brute-forcing and the
  // bcrypt cost of failed backup-code attempts per IP. Only relevant on the
  // enabled break-glass path, so it runs after the gate / pending-session guards.
  const limited = context.get(rateLimitContext)
  if (limited) {
    const submission = await parseWithZod(formData, { async: true, schema })
    return data(
      {
        submissionResult: submission.reply({
          formErrors: [
            `Příliš mnoho pokusů. Zkuste to prosím ${formatRetryAfter(limited.retryAfter)}.`,
          ],
        }),
      },
      { status: 429 },
    )
  }

  const submission = await parseWithZod(formData, { async: true, schema })

  if (submission.status !== 'success') {
    return data(
      { submissionResult: submission.reply() },
      { status: submission.status === 'error' ? 400 : 200 },
    )
  }

  // Second factor verified — create the session and clear the pending cookie.
  // 303 See Other so the browser issues a GET after this POST, matching the
  // other redirects in this flow. Shared by the TOTP and backup-code branches.
  const succeed = async (
    method: 'two_factor' | 'backup_code',
  ): Promise<never> => {
    const session = await createSession(userId)

    recordAuthLog({ event: 'sign_in_success', method, request, userId })

    const headers = new Headers()
    headers.append(
      'Set-Cookie',
      await setSessionAuthCookieSession(
        request,
        session.id,
        session.expirationDate,
      ),
    )
    headers.append(
      'Set-Cookie',
      await deletePendingTwoFactorCookieSession(cookieSession),
    )

    throw redirect('/administration', { headers, status: 303 })
  }

  // Count the failed guess; once the cap is hit, invalidate the pending cookie
  // so the user must re-enter their password. Covers both TOTP and backup-code
  // attempts, bounding brute-forcing within the cookie lifetime.
  const fail = async (field: 'backupCode' | 'code', message: string) => {
    recordAuthLog({
      event: 'two_factor_failure',
      method: field === 'backupCode' ? 'backup_code' : 'two_factor',
      request,
      userId,
    })

    const attempts = getPendingTwoFactorAttempts(cookieSession) + 1

    if (attempts >= MAX_TWO_FACTOR_ATTEMPTS) {
      throw await redirectToPassword()
    }

    return data(
      {
        submissionResult: submission.reply({
          fieldErrors: { [field]: [message] },
        }),
      },
      {
        headers: {
          'Set-Cookie': await setPendingTwoFactorCookieSession(
            request,
            userId,
            attempts,
          ),
        },
        status: 400,
      },
    )
  }

  // Enrollment must still exist for either factor. If the 2fa row was removed
  // between steps, restart from the password step regardless of which code was
  // entered — this also stops a backup code from creating a session after 2FA
  // was disabled.
  const twoFactor = await getUserTwoFactor(userId)

  if (twoFactor === null) {
    throw await redirectToPassword()
  }

  // Backup-code branch: match the entered code against the user's unused codes.
  if (submission.value.backupCode !== undefined) {
    const redeemed = await redeemBackupCode(userId, submission.value.backupCode)

    if (!redeemed) {
      return fail('backupCode', 'Záložní kód je neplatný nebo již byl použit.')
    }

    return succeed('backup_code')
  }

  // The schema guarantees one field is present, so a missing backup code means a
  // TOTP was submitted.
  const { code } = submission.value

  if (code === undefined) {
    throw await redirectToPassword()
  }

  const result = await verifyTOTP({
    // The OTP columns are nullable on the shared Verification model (magic link
    // leaves them unset); a 2fa row always has them, so coalesce null → undefined
    // to satisfy verifyTOTP, which falls back to its defaults.
    algorithm: twoFactor.algorithm ?? undefined,
    charSet: twoFactor.charSet ?? undefined,
    digits: twoFactor.digits ?? undefined,
    otp: code,
    period: twoFactor.period ?? undefined,
    secret: twoFactor.secret,
  })

  if (result === null) {
    return fail('code', 'Kód je nesprávný nebo jeho platnost vypršela.')
  }

  return succeed('two_factor')
}
