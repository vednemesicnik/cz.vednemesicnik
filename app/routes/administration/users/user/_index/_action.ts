import { invariantResponse } from '@epic-web/invariant'
import { href, redirect } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'
import { deleteUser } from './utils/delete-user'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value
const REDIRECT_NAME = FORM_CONFIG.redirect.name

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { userId } = params

  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(INTENT_NAME)
  invariantResponse(typeof intent === 'string', 'Missing intent')

  const withRedirect = formData.get(REDIRECT_NAME) === 'true'

  const currentUser = await prisma.user.findUniqueOrThrow({
    select: {
      id: true,
      role: {
        select: { level: true },
      },
    },
    where: { id: userId },
  })

  switch (intent) {
    case INTENT_VALUE.delete:
      await deleteUser(request, {
        id: userId,
        target: {
          roleLevel: currentUser.role.level,
          userId: currentUser.id,
        },
      })

      if (withRedirect) {
        throw redirect(href('/administration/users'))
      }
      break

    default:
      throw new Error(`Invalid intent: ${intent}`)
  }
}
