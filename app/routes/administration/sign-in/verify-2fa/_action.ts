import { parseWithZod } from '@conform-to/zod/v4'
import { type ActionFunctionArgs, data, redirect } from 'react-router'

import { setSessionAuthCookieSession } from '~/utils/auth.server'
import { checkHoneypot } from '~/utils/honeypot.server'
import {
  deletePendingTwoFactorCookieSession,
  getPendingTwoFactorAttempts,
  getPendingTwoFactorCookieSession,
  getPendingTwoFactorUserId,
  MAX_TWO_FACTOR_ATTEMPTS,
  setPendingTwoFactorCookieSession,
} from '~/utils/pending-two-factor.server'
import { createSession } from '~/utils/session.server'
import { verifyTOTP } from '~/utils/totp.server'
import { getUserTwoFactor } from '~/utils/two-factor.server'

import { schema } from './_schema'

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()

  checkHoneypot(formData)

  // Break-glass: the whole password path is gated behind the flag.
  if (process.env.ALLOW_PASSWORD_SIGN_IN !== 'true') {
    throw redirect('/administration/sign-in', { status: 303 })
  }

  const cookieSession = await getPendingTwoFactorCookieSession(request)
  const userId = getPendingTwoFactorUserId(cookieSession)

  // No pending sign-in — restart from the password step.
  if (userId === undefined) {
    throw redirect('/administration/sign-in', { status: 303 })
  }

  const submission = await parseWithZod(formData, { async: true, schema })

  if (submission.status !== 'success') {
    return data(
      { submissionResult: submission.reply() },
      { status: submission.status === 'error' ? 400 : 200 },
    )
  }

  const twoFactor = await getUserTwoFactor(userId)

  // Enrollment was removed between steps — drop the pending cookie and restart.
  if (twoFactor === null) {
    throw redirect('/administration/sign-in', {
      headers: {
        'Set-Cookie': await deletePendingTwoFactorCookieSession(cookieSession),
      },
      status: 303,
    })
  }

  const result = await verifyTOTP({
    algorithm: twoFactor.algorithm,
    charSet: twoFactor.charSet,
    digits: twoFactor.digits,
    otp: submission.value.code,
    period: twoFactor.period,
    secret: twoFactor.secret,
  })

  if (result === null) {
    // Count the failed guess; once the cap is hit, invalidate the pending
    // cookie so the user must re-enter their password (bounds brute-forcing the
    // 6-digit code within the cookie lifetime).
    const attempts = getPendingTwoFactorAttempts(cookieSession) + 1

    if (attempts >= MAX_TWO_FACTOR_ATTEMPTS) {
      throw redirect('/administration/sign-in', {
        headers: {
          'Set-Cookie':
            await deletePendingTwoFactorCookieSession(cookieSession),
        },
        status: 303,
      })
    }

    return data(
      {
        submissionResult: submission.reply({
          fieldErrors: {
            code: ['Kód je nesprávný nebo jeho platnost vypršela.'],
          },
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

  // Second factor verified — now create the session and clear the pending cookie.
  const session = await createSession(userId)

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

  // 303 See Other so the browser issues a GET for the destination after this
  // POST, matching the other redirects in this flow.
  throw redirect('/administration', { headers, status: 303 })
}
