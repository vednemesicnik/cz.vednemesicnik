import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = ComponentProps<'button'> & {
  active?: boolean
}

export const ToolbarButton = ({
  children,
  className,
  active = false,
  type = 'button',
  ...rest
}: Props) => (
  <button
    className={clsx(styles.button, active && styles.active, className)}
    type={type}
    {...rest}
  >
    {children}
  </button>
)
