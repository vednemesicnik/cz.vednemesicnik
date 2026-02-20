import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

export const KeyboardArrowLeftIcon = ({ className }: Props) => {
  return (
    <svg
      aria-label={'Ikona šipky vlevo'}
      className={clsx(styles.icon, className)}
      role={'img'}
      viewBox={'0 -960 960 960'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <path d={'M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z'} />
    </svg>
  )
}
