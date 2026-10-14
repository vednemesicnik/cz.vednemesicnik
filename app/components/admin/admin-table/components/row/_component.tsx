import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'
import { useLiveChangeTint } from './utils/use-live-change-tint'

/** A row's 22f tint: when it started on the tab's clock, and how many changes it counts. */
export type TableRowTint = {
  startedAt: number
  sequence: number
}

type Props = {
  children: ReactNode
  // Tertiary text for a row out of play, e.g. an archived article (design 22a)
  muted?: boolean
  className?: string
  tint?: TableRowTint
}

/**
 * A row of the administration table.
 *
 * @param props.tint - Tints a row that has just changed (design 22f): the tint
 *   holds 3 s, then fades in 300 ms, and plays once, even when the row is
 *   mounted again. A higher `sequence` restarts it.
 */
export const TableRow = ({
  children,
  muted = false,
  className,
  tint,
}: Props) => {
  const tintRef = useLiveChangeTint(tint?.startedAt ?? null)

  return (
    <tr
      className={clsx(
        styles.row,
        muted && styles.muted,
        // Two identical animations, so the next change restarts the tint.
        tint !== undefined &&
          (tint.sequence % 2 === 0 ? styles.tintEven : styles.tintOdd),
        className,
      )}
      ref={tintRef}
    >
      {children}
    </tr>
  )
}
