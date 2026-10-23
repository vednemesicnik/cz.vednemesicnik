import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

/**
 * Lucide's chevron-down (n0kx6u98). Always decorative: the control around it
 * carries the name.
 */
export const ArrowDropDownIcon = ({ className }: Props) => {
  return (
    <svg
      aria-hidden={true}
      className={clsx(styles.icon, className)}
      viewBox={'0 0 24 24'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <path d={'m6 9 6 6 6-6'} />
    </svg>
  )
}
