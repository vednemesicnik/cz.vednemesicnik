import type { ContentState } from '@generated/prisma/enums'

type Options = {
  state: ContentState
  submittedAt: Date | null
  authorIds: string[]
  authorId: string
}

/**
 * Whether the author may take a submitted article back to draft (Vzít zpět do
 * konceptu, design 07d): any of its authors, while it waits or is approved.
 *
 * @param options.state - The article's content state.
 * @param options.submittedAt - When it was submitted, or null.
 * @param options.authorIds - The article's authors.
 * @param options.authorId - The signed-in author.
 * @returns True when the submission can be withdrawn.
 */
export const canWithdrawSubmission = ({
  state,
  submittedAt,
  authorIds,
  authorId,
}: Options): boolean =>
  state === 'draft' && submittedAt !== null && authorIds.includes(authorId)
