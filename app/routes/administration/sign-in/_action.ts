import { parseWithZod } from '@conform-to/zod/v4'
import bcrypt from 'bcryptjs'
import { type ActionFunctionArgs, data, redirect } from 'react-router'

import { setSessionAuthCookieSession } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { checkHoneypot } from '~/utils/honeypot.server'
import { setPendingTwoFactorCookieSession } from '~/utils/pending-two-factor.server'
import { createSession } from '~/utils/session.server'
import { getUserTwoFactor } from '~/utils/two-factor.server'

import { schema } from './_schema'

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()

  checkHoneypot(formData)

  // Break-glass gate: the password is a disabled emergency path. Reject before
  // ever verifying the hash when the flag is off — hiding the UI is not enough,
  // this action is directly POST-able.
  if (process.env.ALLOW_PASSWORD_SIGN_IN !== 'true') {
    // 303 See Other: turn this POST rejection into a GET redirect so the client
    // cannot retry with POST semantics.
    throw redirect('/administration/sign-in', { status: 303 })
  }

  const submission = await parseWithZod(formData, {
    async: true,
    schema,
  })

  if (submission.status !== 'success') {
    return data(
      {
        authenticationOptions: null,
        isAuthenticated: false,
        registrationOptions: null,
        submissionResult: submission.reply({
          hideFields: ['password'],
        }),
      },
      {
        status: submission.status === 'error' ? 400 : 200,
      },
    )
  }

  const { email, password } = submission.value

  let user = await prisma.user.findUnique({
    select: {
      id: true,
      password: { select: { hash: true } },
    },
    where: { email },
  })

  if (user !== null && user.password !== null) {
    const isValid = await bcrypt.compare(password, user.password.hash)

    user = isValid ? user : null
  }

  if (user === null) {
    return data(
      {
        authenticationOptions: null,
        isAuthenticated: false,
        registrationOptions: null,
        submissionResult: submission.reply({
          formErrors: ['E-mail nebo heslo je nesprávné.'],
          hideFields: ['password'],
        }),
      },
      {
        status: 400,
      },
    )
  }

  // Second factor for the break-glass path: if the user has TOTP enrolled, do
  // not create a session yet — stash the user id in a short-lived cookie and
  // redirect to the TOTP entry step, which creates the session once verified.
  const twoFactor = await getUserTwoFactor(user.id)

  if (twoFactor !== null) {
    throw redirect('/administration/sign-in/verify-2fa', {
      headers: {
        'Set-Cookie': await setPendingTwoFactorCookieSession(request, user.id),
      },
      status: 303,
    })
  }

  const session = await createSession(user.id)

  throw redirect('/administration', {
    headers: {
      'Set-Cookie': await setSessionAuthCookieSession(
        request,
        session.id,
        session.expirationDate,
      ),
    },
  })
}
