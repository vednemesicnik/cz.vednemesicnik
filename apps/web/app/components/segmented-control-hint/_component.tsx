import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { useSegmentedControl } from '~/components/segmented-control'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A note under a `SegmentedControl`'s segments, read with the group as its
 * description.
 *
 * @param props.children - The note, e.g. „Vzhled se řídí nastavením zařízení.“
 * @returns The note's paragraph
 */
export const SegmentedControlHint = ({ children, className }: Props) => {
  const { hintId } = useSegmentedControl()

  return (
    <p className={clsx(styles.hint, className)} id={hintId}>
      {children}
    </p>
  )
}
