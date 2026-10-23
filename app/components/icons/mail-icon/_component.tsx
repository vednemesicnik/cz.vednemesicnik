import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

/**
 * Lucide's mail (n0kx6u98). Always decorative: the control around it
 * carries the name.
 */
export const MailIcon = ({ className }: Props) => {
  return (
    <svg
      aria-hidden={true}
      className={clsx(styles.icon, className)}
      viewBox={'0 0 24 24'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <path d={'m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7'} />
      <rect height={16} rx={2} width={20} x={2} y={4} />
    </svg>
  )
}
