import { invariantResponse } from '@epic-web/invariant'
import { href, redirect } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'
import { archivePosition } from './utils/archive-position'
import { deletePosition } from './utils/delete-position'
import { publishPosition } from './utils/publish-position'
import { restorePosition } from './utils/restore-position'
import { retractPosition } from './utils/retract-position'
import { reviewPosition } from './utils/review-position'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value
const REDIRECT_NAME = FORM_CONFIG.redirect.name

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { positionId } = params

  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(INTENT_NAME)
  invariantResponse(typeof intent === 'string', 'Missing intent')

  const withRedirect = formData.get(REDIRECT_NAME) === 'true'

  const currentPosition = await prisma.editorialBoardPosition.findUniqueOrThrow(
    {
      select: { authorId: true, state: true },
      where: { id: positionId },
    },
  )

  switch (intent) {
    case INTENT_VALUE.archive:
      await archivePosition(request, {
        id: positionId,
        target: currentPosition,
      })
      break

    case INTENT_VALUE.delete:
      await deletePosition(request, {
        id: positionId,
        target: currentPosition,
      })

      if (withRedirect) {
        throw redirect(href('/administration/editorial-board/positions'))
      }
      break

    case INTENT_VALUE.publish:
      await publishPosition(request, {
        id: positionId,
        target: currentPosition,
      })
      break

    case INTENT_VALUE.restore:
      await restorePosition(request, {
        id: positionId,
        target: currentPosition,
      })
      break

    case INTENT_VALUE.retract:
      await retractPosition(request, {
        id: positionId,
        target: currentPosition,
      })
      break

    case INTENT_VALUE.review:
      await reviewPosition(request, {
        id: positionId,
        target: currentPosition,
      })
      break

    default:
      throw new Error(`Invalid intent: ${intent}`)
  }
}
