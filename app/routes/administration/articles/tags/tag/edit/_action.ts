import { parseWithZod } from '@conform-to/zod/v4'
import { data } from 'react-router'

import { checkCSRF } from '~/utils/csrf.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { getTaxonomyConflictErrors } from '../../../utils/get-taxonomy-conflict-errors'
import { taxonomyRecordSchema } from '../../../utils/taxonomy-record-schema'
import { TAG_RECORD_COPY } from '../../tag-record-copy'
import type { Route } from './+types/route'
import { updateTag } from './utils/update-tag.server'

export const action = async ({ request, params }: Route.ActionArgs) => {
  const formData = await request.formData()
  const csrfFailure = await checkCSRF(formData, request)
  if (csrfFailure !== null) return csrfFailure

  const submission = parseWithZod(formData, { schema: taxonomyRecordSchema })

  if (submission.status !== 'success') {
    return data(
      { slugSuggestion: null, submissionResult: submission.reply() },
      { status: getStatusCodeFromSubmissionStatus(submission.status) },
    )
  }

  const { authorId, name, slug } = submission.value

  const result = await updateTag(request, {
    name,
    requestedAuthorId: authorId,
    slug,
    tagId: params.tagId,
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

  return { id: result.id, intent: null, status: 'success' as const }
}
