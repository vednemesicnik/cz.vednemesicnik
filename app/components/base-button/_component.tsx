import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = ComponentProps<'button'>

export const BaseButton = ({ children, className, ...rest }: Props) => (
  <button className={clsx(styles.button, className)} {...rest}>
    {children}
  </button>
)
