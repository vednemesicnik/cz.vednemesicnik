import { invariantResponse } from '@epic-web/invariant'
import { href, redirect } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'
import { archiveArticle } from './utils/archive-article'
import { deleteArticle } from './utils/delete-article'
import { publishArticle } from './utils/publish-article'
import { restoreArticle } from './utils/restore-article'
import { retractArticle } from './utils/retract-article'
import { reviewArticle } from './utils/review-article'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value
const REDIRECT_NAME = FORM_CONFIG.redirect.name

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { articleId } = params

  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(INTENT_NAME)
  invariantResponse(typeof intent === 'string', 'Missing intent')

  const withRedirect = formData.get(REDIRECT_NAME) === 'true'

  const currentArticle = await prisma.article.findUniqueOrThrow({
    select: { authorId: true, state: true },
    where: { id: articleId },
  })

  switch (intent) {
    case INTENT_VALUE.archive:
      await archiveArticle(request, {
        id: articleId,
        target: currentArticle,
      })
      break

    case INTENT_VALUE.delete:
      await deleteArticle(request, {
        id: articleId,
        target: currentArticle,
      })

      if (withRedirect) {
        throw redirect(href('/administration/articles'))
      }
      break

    case INTENT_VALUE.publish:
      await publishArticle(request, {
        id: articleId,
        target: currentArticle,
      })
      break

    case INTENT_VALUE.restore:
      await restoreArticle(request, {
        id: articleId,
        target: currentArticle,
      })
      break

    case INTENT_VALUE.retract:
      await retractArticle(request, {
        id: articleId,
        target: currentArticle,
      })
      break

    case INTENT_VALUE.review:
      await reviewArticle(request, {
        id: articleId,
        target: currentArticle,
      })
      break

    default:
      throw new Error(`Invalid intent: ${intent}`)
  }
}
