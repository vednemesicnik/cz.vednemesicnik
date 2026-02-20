import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

export const KeyboardArrowRightIcon = ({ className }: Props) => {
  return (
    <svg
      aria-label={'Ikona šipky vpravo'}
      className={clsx(styles.icon, className)}
      role={'img'}
      viewBox={'0 -960 960 960'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <path d={'M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z'} />
    </svg>
  )
}
