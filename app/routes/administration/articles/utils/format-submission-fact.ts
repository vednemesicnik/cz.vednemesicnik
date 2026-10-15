import { formatNumericDate } from '~/utils/format-numeric-date'
import type { SubmissionState } from '~/utils/permissions/author/submission/get-submission-state'

/**
 * A submitted draft's fact, under the detail's title and in the editor's
 * header line alike (design 23a, 24c).
 *
 * @param submission - Waiting or approved, with its date.
 * @returns Since when it waits (`od 25. 9. 2026`), or when it was approved.
 */
export const formatSubmissionFact = (submission: SubmissionState): string =>
  submission.state === 'pending'
    ? `od ${formatNumericDate(submission.date)}`
    : formatNumericDate(submission.date)
