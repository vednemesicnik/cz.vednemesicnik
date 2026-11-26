import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

/**
 * Lucide's chevron „›“: the whole row leads on (24f, u94oosdp), as the design
 * system's `LinkRow trailing="chevron"`. Always decorative: the row carries
 * the name.
 */
export const ChevronRightIcon = ({ className }: Props) => {
  return (
    <svg
      aria-hidden={true}
      className={clsx(styles.icon, className)}
      viewBox={'0 0 24 24'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <path d={'m9 18 6-6-6-6'} />
    </svg>
  )
}
