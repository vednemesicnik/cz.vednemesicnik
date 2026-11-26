import type { FilterOption } from '~/components/filter-menu'
import {
  CONTENT_QUEUE_LABELS,
  CONTRIBUTOR_STATE_FILTER_QUEUES,
  type QueueCount,
  STATE_FILTER_QUEUES,
} from '~/config/content-queue-config'
import type { ListNoun } from '~/config/list-noun-config'
import { formatPendingSummary } from '~/utils/format-pending-summary'

type StateFilterOptions = {
  isApprover: boolean
  isContributor: boolean
  queueCounts: QueueCount[]
  noun: ListNoun
}

/**
 * The Stav filter of a content list (design 22a, 22d, 25a): its values for
 * the role with their counts, and the work waiting for the Coordinator.
 *
 * @param options - The viewer's role, the counted queues and the list's noun.
 * @returns The menu's `options` and, while something waits for the
 *   Coordinator, the `attention` count on the button with what a screen reader
 *   hears (cioukqn6).
 */
export const getStateFilter = ({
  isApprover,
  isContributor,
  queueCounts,
  noun,
}: StateFilterOptions) => {
  const pendingCount =
    queueCounts.find((entry) => entry.queue === 'pending')?.count ?? 0

  const options: FilterOption[] = (
    isContributor ? CONTRIBUTOR_STATE_FILTER_QUEUES : STATE_FILTER_QUEUES
  ).map((queue) => ({
    // Ke schválení waits only for the Coordinator, who approves (22d).
    attention: queue === 'pending' && isApprover && pendingCount > 0,
    count: queueCounts.find((entry) => entry.queue === queue)?.count,
    label: CONTENT_QUEUE_LABELS[queue],
    value: queue,
  }))

  // The work that waits is a count on Stav, for the Coordinator only, also
  // while Ke schválení is selected; it goes only at 0 (22d, cioukqn6).
  const attention =
    isApprover && pendingCount > 0
      ? {
          count: pendingCount,
          description: formatPendingSummary(pendingCount, noun),
        }
      : undefined

  return { attention, options }
}
