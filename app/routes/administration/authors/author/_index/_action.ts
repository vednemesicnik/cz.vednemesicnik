import { invariantResponse } from '@epic-web/invariant'
import { data, href, redirect } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { requireCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'
import { deleteAuthor } from './utils/delete-author'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value
const REDIRECT_NAME = FORM_CONFIG.redirect.name

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { authorId } = params

  const formData = await request.formData()
  await requireCSRF(formData, request)

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
    case INTENT_VALUE.delete: {
      const result = await deleteAuthor(request, {
        id: authorId,
        target: {
          userId: author.user?.id,
        },
      })

      // Something came to hold the author after the page loaded: returned,
      // not thrown, so the fetcher stays on the page. A 4xx skips the loaders'
      // revalidation, so the body carries the fresh block for the 28g
      // explanation, and the page revalidates itself.
      if (result.status === 'blocked') {
        return data(result, { status: 409 })
      }

      if (withRedirect) {
        throw redirect(href('/administration/authors'))
      }
      break
    }

    default:
      throw new Error(`Invalid intent: ${intent}`)
  }
}
