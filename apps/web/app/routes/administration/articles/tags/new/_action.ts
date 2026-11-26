import { parseWithZod } from '@conform-to/zod/v4'
import { data } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { checkCSRF } from '~/utils/csrf.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { getTaxonomyConflictErrors } from '../../utils/get-taxonomy-conflict-errors'
import { newTaxonomyRecordSchema } from '../../utils/taxonomy-record-schema'
import { tagContentStateHandlers } from '../tag/_index/utils/content-state-handlers.server'
import { tagSubmissionHandlers } from '../tag/_index/utils/submission-handlers.server'
import { TAG_RECORD_COPY } from '../tag-record-copy'
import type { Route } from './+types/route'
import { createArticleTag } from './utils/create-article-tag.server'

const INTENT_VALUE = FORM_CONFIG.intent.value

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData()
  const csrfFailure = await checkCSRF(formData, request)
  if (csrfFailure !== null) return csrfFailure

  const submission = parseWithZod(formData, { schema: newTaxonomyRecordSchema })

  if (submission.status !== 'success') {
    return data(
      { slugSuggestion: null, submissionResult: submission.reply() },
      { status: getStatusCodeFromSubmissionStatus(submission.status) },
    )
  }

  const { authorId, intent, name, slug } = submission.value

  const result = await createArticleTag(request, {
    intent,
    name,
    requestedAuthorId: authorId,
    slug,
  })

  if (result.status === 'conflict') {
    return data(
      {
        slugSuggestion: result.slugSuggestion,
        submissionResult: submission.reply({
          fieldErrors: getTaxonomyConflictErrors(result, TAG_RECORD_COPY),
        }),
      },
      { status: 400 },
    )
  }

  // Not one transaction with the create: should this step be refused, the
  // draft stays and the person finds it in the list.
  const target = { authorIds: [result.authorId], state: 'draft' as const }

  if (intent === INTENT_VALUE.publish) {
    await tagContentStateHandlers.publish(request, {
      id: result.id,
      target,
    })
  }

  if (intent === INTENT_VALUE.submitForReview) {
    await tagSubmissionHandlers.submit(request, { id: result.id, target })
  }

  return { id: result.id, intent, name, slug, status: 'success' as const }
}
