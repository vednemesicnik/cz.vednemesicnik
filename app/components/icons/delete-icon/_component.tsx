import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

/**
 * Lucide's trash (n0kx6u98). Always decorative: the control around it
 * carries the name.
 */
export const DeleteIcon = ({ className }: Props) => {
  return (
    <svg
      aria-hidden={true}
      className={clsx(styles.icon, className)}
      viewBox={'0 0 24 24'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <path d={'M10 11v6'} />
      <path d={'M14 11v6'} />
      <path d={'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6'} />
      <path d={'M3 6h18'} />
      <path d={'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'} />
    </svg>
  )
}
