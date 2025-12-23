import { invariantResponse } from '@epic-web/invariant'
import { href, redirect } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'
import { archiveCategory } from './utils/archive-category'
import { deleteCategory } from './utils/delete-category'
import { publishCategory } from './utils/publish-category'
import { restoreCategory } from './utils/restore-category'
import { retractCategory } from './utils/retract-category'
import { reviewCategory } from './utils/review-category'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value
const REDIRECT_NAME = FORM_CONFIG.redirect.name

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { categoryId } = params

  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(INTENT_NAME)
  invariantResponse(typeof intent === 'string', 'Missing intent')

  const withRedirect = formData.get(REDIRECT_NAME) === 'true'

  const currentCategory = await prisma.articleCategory.findUniqueOrThrow({
    select: { authorId: true, state: true },
    where: { id: categoryId },
  })

  switch (intent) {
    case INTENT_VALUE.archive:
      await archiveCategory(request, {
        id: categoryId,
        target: currentCategory,
      })
      break

    case INTENT_VALUE.delete:
      await deleteCategory(request, {
        id: categoryId,
        target: currentCategory,
      })

      if (withRedirect) {
        throw redirect(href('/administration/articles/categories'))
      }
      break

    case INTENT_VALUE.publish:
      await publishCategory(request, {
        id: categoryId,
        target: currentCategory,
      })
      break

    case INTENT_VALUE.restore:
      await restoreCategory(request, {
        id: categoryId,
        target: currentCategory,
      })
      break

    case INTENT_VALUE.retract:
      await retractCategory(request, {
        id: categoryId,
        target: currentCategory,
      })
      break

    case INTENT_VALUE.review:
      await reviewCategory(request, {
        id: categoryId,
        target: currentCategory,
      })
      break

    default:
      throw new Error(`Invalid intent: ${intent}`)
  }
}
