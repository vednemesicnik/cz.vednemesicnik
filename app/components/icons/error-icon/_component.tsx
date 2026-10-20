import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

/**
 * Lucide's circle-alert, as the design system's error line (ujd6js4y). Always
 * decorative: the message next to it carries the error.
 */
export const ErrorIcon = ({ className }: Props) => {
  return (
    <svg
      aria-hidden={true}
      className={clsx(styles.icon, className)}
      viewBox={'0 0 24 24'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <circle cx={12} cy={12} r={10} />
      <path d={'M12 8v4'} />
      <path d={'M12 16h.01'} />
    </svg>
  )
}
