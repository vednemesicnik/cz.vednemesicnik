import type { CountForms } from '~/config/list-noun-config'
import { formatListCount } from '~/utils/format-list-count'

/**
 * The toast after a bulk delete (design 22c, 25g, 26f): *Smazáno: počet*, the
 * real result rather than the selection's size, one sentence without a period.
 *
 * @param deletedCount - How many records were deleted.
 * @param countForms - The list's noun by plural rule (`ISSUE_NOUN.countForms`, …).
 * @returns „Smazáno: 2 čísla“, or „Nic nebylo smazáno“ when nothing was.
 */
export const formatBulkDeleteToast = (
  deletedCount: number,
  countForms: CountForms,
) =>
  deletedCount === 0
    ? 'Nic nebylo smazáno'
    : `Smazáno: ${formatListCount(deletedCount, countForms)}`
