import type { ContentState } from '@generated/prisma/enums'

import { APPROVER_ROLE_LEVEL } from '../review-policy'

type Options = {
  state: ContentState
  submittedAt: Date | null
  roleLevel: number
}

/**
 * Whether the signed-in author may return a submitted article for edits (Vrátit
 * k úpravám, design 07d): only an approver, while it waits or is approved.
 *
 * @param options.state - The article's content state.
 * @param options.submittedAt - When it was submitted, or null.
 * @param options.roleLevel - The signed-in author's role level.
 * @returns True when the article can be returned for edits.
 */
export const canReturnForEdits = ({
  state,
  submittedAt,
  roleLevel,
}: Options): boolean =>
  state === 'draft' && submittedAt !== null && roleLevel <= APPROVER_ROLE_LEVEL
