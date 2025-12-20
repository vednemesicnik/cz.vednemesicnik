import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

export const ArrowUpward = ({ className }: Props) => {
  return (
    <svg
      aria-label={'Ikona šipky nahoru'}
      className={clsx(styles.icon, className)}
      role={'img'}
      viewBox={'0 -960 960 960'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <path
        d={
          'M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z'
        }
      />
    </svg>
  )
}
