import type { ContentState } from '@generated/prisma/enums'

import type { StatusTagState } from '~/components/status-tag'
import { getSubmissionState } from '~/utils/permissions/author/submission/get-submission-state'

type Content = {
  state: ContentState
  submittedAt: Date | null
  reviews: { createdAt: Date; reviewer: { role: { level: number } } }[]
}

/**
 * The state tag a piece of content carries on the public web (10d): what the
 * administration's tag says (07a), for content the reader doesn't see.
 *
 * @param content - Its state, submission and reviews (`WEB_PREVIEW_STATE_SELECT`).
 * @returns `draft`, `pending`, `approved` or `archived`, or `null` for
 *   published content, which carries no tag.
 */
export const getWebPreviewState = (content: Content): StatusTagState | null => {
  if (content.state === 'published') return null

  return getSubmissionState(content)?.state ?? content.state
}
