import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

/**
 * Lucide's archive (n0kx6u98). Always decorative: the control around it
 * carries the name.
 */
export const ArchiveIcon = ({ className }: Props) => {
  return (
    <svg
      aria-hidden={true}
      className={clsx(styles.icon, className)}
      viewBox={'0 0 24 24'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <rect height={5} rx={1} width={20} x={2} y={3} />
      <path d={'M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8'} />
      <path d={'M10 12h4'} />
    </svg>
  )
}
