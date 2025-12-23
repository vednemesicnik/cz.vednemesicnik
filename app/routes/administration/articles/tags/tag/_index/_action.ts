import { invariantResponse } from '@epic-web/invariant'
import { href, redirect } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'
import { archiveTag } from './utils/archive-tag'
import { deleteTag } from './utils/delete-tag'
import { publishTag } from './utils/publish-tag'
import { restoreTag } from './utils/restore-tag'
import { retractTag } from './utils/retract-tag'
import { reviewTag } from './utils/review-tag'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value
const REDIRECT_NAME = FORM_CONFIG.redirect.name

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { tagId } = params

  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(INTENT_NAME)
  invariantResponse(typeof intent === 'string', 'Missing intent')

  const withRedirect = formData.get(REDIRECT_NAME) === 'true'

  const currentTag = await prisma.articleTag.findUniqueOrThrow({
    select: { authorId: true, state: true },
    where: { id: tagId },
  }) // TODO: authorId and state could be sent in formData to reduce DB calls

  switch (intent) {
    case INTENT_VALUE.archive:
      await archiveTag(request, {
        id: tagId,
        target: currentTag,
      })
      break

    case INTENT_VALUE.delete:
      await deleteTag(request, {
        id: tagId,
        target: currentTag,
      })

      if (withRedirect) {
        throw redirect(href('/administration/articles/tags'))
      }
      break

    case INTENT_VALUE.publish:
      await publishTag(request, {
        id: tagId,
        target: currentTag,
      })
      break

    case INTENT_VALUE.restore:
      await restoreTag(request, {
        id: tagId,
        target: currentTag,
      })
      break

    case INTENT_VALUE.retract:
      await retractTag(request, {
        id: tagId,
        target: currentTag,
      })
      break

    case INTENT_VALUE.review:
      await reviewTag(request, {
        id: tagId,
        target: currentTag,
      })
      break

    default:
      throw new Error(`Invalid intent: ${intent}`)
  }
}
