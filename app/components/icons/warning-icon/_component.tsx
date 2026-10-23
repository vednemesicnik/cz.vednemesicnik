import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

/**
 * Lucide's triangle-alert, as the design system's warning callout (rmridl1f).
 * Always decorative: the text next to it carries the warning.
 */
export const WarningIcon = ({ className }: Props) => {
  return (
    <svg
      aria-hidden={true}
      className={clsx(styles.icon, className)}
      viewBox={'0 0 24 24'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <path
        d={
          'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3'
        }
      />
      <path d={'M12 9v4'} />
      <path d={'M12 17h.01'} />
    </svg>
  )
}
