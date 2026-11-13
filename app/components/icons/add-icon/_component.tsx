import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Pick<ComponentProps<'svg'>, 'className'>

export const AddIcon = ({ className }: Props) => {
  return (
    <svg
      aria-label={'Ikona přidání'}
      className={clsx(styles.icon, className)}
      role={'img'}
      viewBox={'0 -960 960 960'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <path d={'M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z'} />
    </svg>
  )
}
