import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

/** Lucide's icon, as the design system draws it (jb81di02). */
export const ListIcon = ({ className }: Props) => {
  return (
    <svg
      aria-hidden={true}
      className={clsx(styles.icon, className)}
      viewBox={'0 0 24 24'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <path d={'M3 6h.01'} />
      <path d={'M3 12h.01'} />
      <path d={'M3 18h.01'} />
      <path d={'M8 6h13'} />
      <path d={'M8 12h13'} />
      <path d={'M8 18h13'} />
    </svg>
  )
}
