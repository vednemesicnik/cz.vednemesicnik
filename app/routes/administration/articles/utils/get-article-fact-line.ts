import type { ContentState } from '@generated/prisma/enums'

import { formatNumericDate } from '~/utils/format-numeric-date'
import { formatTime } from '~/utils/format-time'
import type { SubmissionState } from '~/utils/permissions/author/submission/get-submission-state'

type Options = {
  state: ContentState
  submission: SubmissionState | null
  updatedAt: Date
  publishedAt: Date | null
  now: Date
}

/**
 * The one fact under a list row's state tag, and under the detail's title,
 * never an instruction (design 22b, 23a).
 *
 * @param options.now - The moment of the request, which decides „dnes“.
 * @returns A draft's last save (`uloženo dnes v 14:02`, else `uloženo 22. 9.
 *   2026`); since when a draft waits (`od 25. 9. 2026`); when it was approved;
 *   when it was published, or archived (its last update: an archived article
 *   isn't edited).
 */
export const getArticleFactLine = ({
  state,
  submission,
  updatedAt,
  publishedAt,
  now,
}: Options): string => {
  if (submission !== null) {
    return submission.state === 'pending'
      ? `od ${formatNumericDate(submission.date)}`
      : formatNumericDate(submission.date)
  }

  switch (state) {
    case 'draft':
      return formatNumericDate(updatedAt) === formatNumericDate(now)
        ? `uloženo dnes v ${formatTime(updatedAt)}`
        : `uloženo ${formatNumericDate(updatedAt)}`
    case 'published':
      return formatNumericDate(publishedAt ?? updatedAt)
    case 'archived':
      return formatNumericDate(updatedAt)
  }
}
