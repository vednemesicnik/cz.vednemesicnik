import { parseWithZod } from '@conform-to/zod'
import bcrypt from 'bcryptjs'
import { type ActionFunctionArgs, data, redirect } from 'react-router'

import { setSessionAuthCookieSession } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { checkHoneypot } from '~/utils/honeypot.server'

import { schema } from './_schema'
import { createSession } from './utils/create-session.server'

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()

  checkHoneypot(formData)

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

  const response = await createSession(user.id)

  if (response?.ok === true) {
    const { session } = response

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

  return { submissionResult: null }
}
