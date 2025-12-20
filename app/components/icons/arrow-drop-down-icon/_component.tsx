import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

export const ArrowDropDownIcon = ({ className }: Props) => {
  return (
    <svg
      aria-label={'Ikona šipky dolů'}
      className={clsx(styles.icon, className)}
      role={'img'}
      viewBox={'0 -960 960 960'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <path d={'M480-360 280-560h400L480-360Z'} />
    </svg>
  )
}
