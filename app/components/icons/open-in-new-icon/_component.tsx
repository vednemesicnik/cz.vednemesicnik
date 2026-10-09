import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'> & {
  // Hidden from screen readers when the link around it already says it opens a new
  // tab (design tyxr2jqk: one icon for every link that opens a new tab).
  decorative?: boolean
}

export const OpenInNewIcon = ({ className, decorative = false }: Props) => {
  return (
    <svg
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : 'Ikona otevření v novém okně'}
      className={clsx(styles.icon, className)}
      role={decorative ? undefined : 'img'}
      viewBox={'0 -960 960 960'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <path
        d={
          'M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z'
        }
      />
    </svg>
  )
}
