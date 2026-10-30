import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

/**
 * Lucide's chevron „‹“: the step back in a sideways-scrolling row (`NavRow`,
 * d104jrnd). Always decorative: the button carries the name.
 */
export const ChevronLeftIcon = ({ className }: Props) => {
  return (
    <svg
      aria-hidden={true}
      className={clsx(styles.icon, className)}
      viewBox={'0 0 24 24'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <path d={'m15 18-6-6 6-6'} />
    </svg>
  )
}
