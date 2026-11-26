import type { ContentState } from '@generated/prisma/enums'

import { canPublishWithoutReview } from '../review-policy'

type Options = {
  state: ContentState
  submittedAt: Date | null
  authors: { id: string; role: { level: number } }[]
  authorId: string
}

/**
 * Whether the author may send the article for review (design 07d): an unsubmitted
 * draft they are one of the authors of, and one that needs approval at all — with
 * a Coordinator among its authors the Coordinator publishes it directly.
 *
 * @param options.state - The article's content state.
 * @param options.submittedAt - When it was submitted, or null.
 * @param options.authors - The article's authors with their role levels.
 * @param options.authorId - The signed-in author.
 * @returns True when Odeslat ke schválení is allowed.
 */
export const canSubmitForReview = ({
  state,
  submittedAt,
  authors,
  authorId,
}: Options): boolean =>
  state === 'draft' &&
  submittedAt === null &&
  authors.some((author) => author.id === authorId) &&
  authors.every((author) => !canPublishWithoutReview(author.role))
