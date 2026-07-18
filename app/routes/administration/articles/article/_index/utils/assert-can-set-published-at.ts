import { invariantResponse } from '@epic-web/invariant'

import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

// Guards shared by backdated publish and change-published-at: only approver-level
// authors may set a publish date, and it can never be in the future.
export const assertCanSetPublishedAt = (
  context: AuthorPermissionContext,
  publishedAt: Date,
) => {
  invariantResponse(
    context.roleLevel <= APPROVER_ROLE_LEVEL,
    'Nemáte oprávnění nastavit datum vydání.',
    { status: 403 },
  )
  invariantResponse(
    publishedAt.getTime() <= Date.now(),
    'Datum publikace nemůže být v budoucnosti.',
    { status: 400 },
  )
}
