import type { ContentState } from '@generated/prisma/enums'

import { formatNumericDate } from '~/utils/format-numeric-date'
import type { SubmissionState } from '~/utils/permissions/author/submission/get-submission-state'

type Options = {
  state: ContentState
  submission: SubmissionState | null
  authorName: string
  submittedByName: string | null
  updatedAt: Date
}

/**
 * The one line under a category's or tag's state tag in its list (design 25a,
 * 25e; copy 3htjei2x).
 *
 * @returns Whose a draft is (its author); who sent a waiting one and when
 *   (`Odesláno · Jakub Novák · 26. 9. 2026`); an approved one's author and
 *   approval date (`Schváleno · Jakub Novák · 30. 9. 2026`, 3vnah8ji); when it
 *   was archived (`Archivováno 14. 6. 2026`, its last update: an archived
 *   record isn't edited); nothing for a published one.
 */
export const getTaxonomyFactLine = ({
  state,
  submission,
  authorName,
  submittedByName,
  updatedAt,
}: Options): string | null => {
  if (submission?.state === 'pending') {
    return `Odesláno · ${submittedByName ?? authorName} · ${formatNumericDate(submission.date)}`
  }

  // The author, not the approver: the line's shape stays from state to state.
  if (submission?.state === 'approved') {
    return `Schváleno · ${authorName} · ${formatNumericDate(submission.date)}`
  }

  switch (state) {
    case 'draft':
      return authorName
    case 'published':
      return null
    case 'archived':
      return `Archivováno ${formatNumericDate(updatedAt)}`
  }
}
