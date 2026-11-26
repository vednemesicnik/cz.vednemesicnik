import { Fragment, type ReactNode, useState } from 'react'

import { BaseButton } from '~/components/base-button'

import styles from './_styles.module.css'

export type HistoryEntry = {
  id: string
  dateTime: string
  formattedDateTime: string
  label: string
  actorName: string | null
  note?: string | null
}

type Props = {
  entries: HistoryEntry[]
  visibleCount?: number
  isIncomplete?: boolean
  children: (entry: HistoryEntry) => ReactNode
}

/**
 * A detail's Historie (design 07f, 23a): newest first, each row *co · kdo*
 * with the date and time under it, and an optional note under that. The list
 * decides which entries show; the caller renders each one.
 *
 * @example
 * ```tsx
 * <HistoryList entries={history.entries} visibleCount={5}>
 *   {(entry) => (
 *     <HistoryListEntry>
 *       <HistoryListEvent>
 *         {entry.label}
 *         {entry.actorName !== null && (
 *           <HistoryListActor>{entry.actorName}</HistoryListActor>
 *         )}
 *       </HistoryListEvent>
 *       <HistoryListTime dateTime={entry.dateTime}>
 *         {entry.formattedDateTime}
 *       </HistoryListTime>
 *     </HistoryListEntry>
 *   )}
 * </HistoryList>
 * ```
 *
 * @param props.entries - The rows, newest first
 * @param props.visibleCount - How many rows show before *Celá historie*,
 *   which expands the list in place; every row shows without it.
 * @param props.isIncomplete - Whether the log misses older events: the grey
 *   line „Starší události se nezaznamenávaly.“ then closes the list, once its
 *   end is visible (07f).
 * @param props.children - Renders one visible entry as a `HistoryListEntry`
 * @returns The list with its expand button or closing line
 */
export const HistoryList = ({
  entries,
  visibleCount,
  isIncomplete,
  children,
}: Props) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const isCapped =
    !isExpanded && visibleCount !== undefined && entries.length > visibleCount
  const visibleEntries = isCapped ? entries.slice(0, visibleCount) : entries

  return (
    <div className={styles.history}>
      <ol className={styles.list}>
        {visibleEntries.map((entry) => (
          <Fragment key={entry.id}>{children(entry)}</Fragment>
        ))}
      </ol>

      {isCapped && (
        <BaseButton
          className={styles.more}
          onClick={() => setIsExpanded(true)}
          type={'button'}
        >
          {'Celá historie'}
        </BaseButton>
      )}

      {!isCapped && isIncomplete && (
        <span className={styles.meta}>
          {'Starší události se nezaznamenávaly.'}
        </span>
      )}
    </div>
  )
}
