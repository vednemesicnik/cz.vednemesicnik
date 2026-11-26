import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  dateTime: string
  className?: string
}

/**
 * When a `HistoryListEntry` happened, under its event.
 *
 * @param props.children - The formatted date and time
 * @param props.dateTime - The same moment as an ISO value
 * @returns The `<time>` element
 */
export const HistoryListTime = ({ children, dateTime, className }: Props) => {
  return (
    <time className={clsx(styles.time, className)} dateTime={dateTime}>
      {children}
    </time>
  )
}
