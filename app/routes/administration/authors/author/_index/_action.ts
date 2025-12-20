import { invariantResponse } from '@epic-web/invariant'
import { href, redirect } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'
import { deleteAuthor } from './utils/delete-author'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value
const REDIRECT_NAME = FORM_CONFIG.redirect.name

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { authorId } = params

  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(INTENT_NAME)
  invariantResponse(typeof intent === 'string', 'Missing intent')

  const withRedirect = formData.get(REDIRECT_NAME) === 'true'

  // Get author's linked user ID for permission check
  const author = await prisma.author.findUniqueOrThrow({
    select: {
      user: { select: { id: true } },
    },
    where: { id: authorId },
  })

  switch (intent) {
    case INTENT_VALUE.delete:
      await deleteAuthor(request, {
        id: authorId,
        target: {
          userId: author.user?.id,
        },
      })

      if (withRedirect) {
        throw redirect(href('/administration/authors'))
      }
      break

    default:
      throw new Error(`Invalid intent: ${intent}`)
  }
}
