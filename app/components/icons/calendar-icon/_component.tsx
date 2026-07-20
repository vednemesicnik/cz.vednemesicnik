import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

export const CalendarIcon = ({ className }: Props) => {
  return (
    <svg
      aria-label={'Ikona kalendáře'}
      className={clsx(styles.icon, className)}
      role={'img'}
      viewBox={'0 -960 960 960'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <path
        d={
          'M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Z'
        }
      />
    </svg>
  )
}
