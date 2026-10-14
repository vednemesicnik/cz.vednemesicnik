import { useState } from 'react'

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
}

/**
 * A detail's Historie (design 07f, 23a): newest first, each row *co · kdo*
 * with the date and time under it, and an optional note under that.
 *
 * @param props.entries - The rows; an entry without an actor shows its label
 *   alone.
 * @param props.visibleCount - How many rows show before *Celá historie*,
 *   which expands the list in place; every row shows without it.
 * @param props.isIncomplete - Whether the log misses older events: the grey
 *   line „Starší události se nezaznamenávaly.“ then closes the list, once its
 *   end is visible (07f).
 */
export const HistoryList = ({ entries, visibleCount, isIncomplete }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const isCapped =
    !isExpanded && visibleCount !== undefined && entries.length > visibleCount
  const visibleEntries = isCapped ? entries.slice(0, visibleCount) : entries

  return (
    <div className={styles.history}>
      <ol className={styles.list}>
        {visibleEntries.map((entry) => (
          <li className={styles.entry} key={entry.id}>
            <span>
              {entry.actorName === null
                ? entry.label
                : `${entry.label} · ${entry.actorName}`}
            </span>
            <time className={styles.meta} dateTime={entry.dateTime}>
              {entry.formattedDateTime}
            </time>
            {entry.note && <span className={styles.meta}>{entry.note}</span>}
          </li>
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
