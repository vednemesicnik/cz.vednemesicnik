import { invariantResponse } from '@epic-web/invariant'
import { href, redirect } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'
import { archiveMember } from './utils/archive-member'
import { deleteMember } from './utils/delete-member'
import { publishMember } from './utils/publish-member'
import { restoreMember } from './utils/restore-member'
import { retractMember } from './utils/retract-member'
import { reviewMember } from './utils/review-member'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value
const REDIRECT_NAME = FORM_CONFIG.redirect.name

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { memberId } = params

  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(INTENT_NAME)
  invariantResponse(typeof intent === 'string', 'Missing intent')

  const withRedirect = formData.get(REDIRECT_NAME) === 'true'

  const currentMember = await prisma.editorialBoardMember.findUniqueOrThrow({
    select: { authorId: true, state: true },
    where: { id: memberId },
  })

  switch (intent) {
    case INTENT_VALUE.archive:
      await archiveMember(request, {
        id: memberId,
        target: currentMember,
      })
      break

    case INTENT_VALUE.delete:
      await deleteMember(request, {
        id: memberId,
        target: currentMember,
      })

      if (withRedirect) {
        throw redirect(href('/administration/editorial-board/members'))
      }
      break

    case INTENT_VALUE.publish:
      await publishMember(request, {
        id: memberId,
        target: currentMember,
      })
      break

    case INTENT_VALUE.restore:
      await restoreMember(request, {
        id: memberId,
        target: currentMember,
      })
      break

    case INTENT_VALUE.retract:
      await retractMember(request, {
        id: memberId,
        target: currentMember,
      })
      break

    case INTENT_VALUE.review:
      await reviewMember(request, {
        id: memberId,
        target: currentMember,
      })
      break

    default:
      throw new Error(`Invalid intent: ${intent}`)
  }
}
