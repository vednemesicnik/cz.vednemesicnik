import { invariantResponse } from '@epic-web/invariant'
import { href, redirect } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'
import { archiveIssue } from './utils/archive-issue'
import { deleteIssue } from './utils/delete-issue'
import { publishIssue } from './utils/publish-issue'
import { restoreIssue } from './utils/restore-issue'
import { retractIssue } from './utils/retract-issue'
import { reviewIssue } from './utils/review-issue'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value
const REDIRECT_NAME = FORM_CONFIG.redirect.name

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { issueId } = params

  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(INTENT_NAME)
  invariantResponse(typeof intent === 'string', 'Missing intent')

  const withRedirect = formData.get(REDIRECT_NAME) === 'true'

  const currentIssue = await prisma.issue.findUniqueOrThrow({
    select: { authorId: true, state: true },
    where: { id: issueId },
  })

  switch (intent) {
    case INTENT_VALUE.archive:
      await archiveIssue(request, {
        id: issueId,
        target: currentIssue,
      })
      break

    case INTENT_VALUE.delete:
      await deleteIssue(request, {
        id: issueId,
        target: currentIssue,
      })

      if (withRedirect) {
        throw redirect(href('/administration/archive'))
      }
      break

    case INTENT_VALUE.publish:
      await publishIssue(request, {
        id: issueId,
        target: currentIssue,
      })
      break

    case INTENT_VALUE.restore:
      await restoreIssue(request, {
        id: issueId,
        target: currentIssue,
      })
      break

    case INTENT_VALUE.retract:
      await retractIssue(request, {
        id: issueId,
        target: currentIssue,
      })
      break

    case INTENT_VALUE.review:
      await reviewIssue(request, {
        id: issueId,
        target: currentIssue,
      })
      break

    default:
      throw new Error(`Invalid intent: ${intent}`)
  }
}
