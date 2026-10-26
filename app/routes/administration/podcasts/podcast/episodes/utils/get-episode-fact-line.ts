import type { ContentState } from '@generated/prisma/enums'

import { formatNumericDate } from '~/utils/format-numeric-date'
import type { SubmissionState } from '~/utils/permissions/author/submission/get-submission-state'

import { formatSubmissionFact } from '../../../../articles/utils/format-submission-fact'

type Options = {
  state: ContentState
  submission: SubmissionState | null
  authorName: string
  updatedAt: Date
}

/**
 * The one line under an episode's state tag in its podcast's table (design
 * 27b): who wrote it, as the article row's author column (22a), and since
 * when it waits or when it was approved.
 *
 * @returns `Tomáš Kříž` for a draft, `Anna Dvořáková · od 25. 9. 2026` for a
 *   waiting one, `Anna Dvořáková · 26. 9. 2026` for an approved one, nothing
 *   for a published one (Publikováno has the date), and when an archived one
 *   was archived (its last update: an archived episode isn't edited).
 */
export const getEpisodeFactLine = ({
  state,
  submission,
  authorName,
  updatedAt,
}: Options): string | null => {
  if (submission !== null) {
    return `${authorName} · ${formatSubmissionFact(submission)}`
  }

  switch (state) {
    case 'draft':
      return authorName
    case 'published':
      return null
    case 'archived':
      return formatNumericDate(updatedAt)
  }
}
