import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

/**
 * Lucide's grip, the six dots of something that can be dragged (22c, 24b).
 * Always decorative: the handle or the tile it marks carries the name.
 */
export const GripVerticalIcon = ({ className }: Props) => {
  return (
    <svg
      aria-hidden={true}
      className={clsx(styles.icon, className)}
      viewBox={'0 0 24 24'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <circle cx={9} cy={5} r={1} />
      <circle cx={9} cy={12} r={1} />
      <circle cx={9} cy={19} r={1} />
      <circle cx={15} cy={5} r={1} />
      <circle cx={15} cy={12} r={1} />
      <circle cx={15} cy={19} r={1} />
    </svg>
  )
}
