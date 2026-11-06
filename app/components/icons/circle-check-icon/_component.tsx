import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

/**
 * Lucide's circle-check, as the verified address of the membership
 * application (15d). Always decorative: the sentence next to it says it.
 */
export const CircleCheckIcon = ({ className }: Props) => {
  return (
    <svg
      aria-hidden={true}
      className={clsx(styles.icon, className)}
      viewBox={'0 0 24 24'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <circle cx={12} cy={12} r={10} />
      <path d={'m9 12 2 2 4-4'} />
    </svg>
  )
}
