import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

/**
 * Lucide's calendar (n0kx6u98). Always decorative: the control around it
 * carries the name.
 */
export const CalendarIcon = ({ className }: Props) => {
  return (
    <svg
      aria-hidden={true}
      className={clsx(styles.icon, className)}
      viewBox={'0 0 24 24'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <path d={'M8 2v3'} />
      <path d={'M16 2v3'} />
      <rect height={18} rx={2} width={18} x={3} y={3} />
      <path d={'M3 9h18'} />
    </svg>
  )
}
