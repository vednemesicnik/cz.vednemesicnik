import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The track of a `SegmentedControl`: its options as joined segments.
 *
 * @param props.children - The `SegmentedControlOption`s
 * @returns The track
 */
export const SegmentedControlOptions = ({ children, className }: Props) => {
  return <div className={clsx(styles.track, className)}>{children}</div>
}
