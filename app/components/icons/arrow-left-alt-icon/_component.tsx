import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

export const ArrowLeftAltIcon = ({ className }: Props) => {
  return (
    <svg
      aria-label={'Ikona šipky doleva'}
      className={clsx(styles.icon, className)}
      role={'img'}
      viewBox={'0 -960 960 960'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <path
        d={'M400-240 160-480l240-240 56 58-142 142h486v80H314l142 142-56 58Z'}
      />
    </svg>
  )
}
