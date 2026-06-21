import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import { BaseButton } from '~/components/base-button'

import styles from './_styles.module.css'

type Props = ComponentProps<'button'> & {
  color?: 'primary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'filled' | 'outline'
}

export const Button = ({
  children,
  className,
  color = 'primary',
  size = 'md',
  variant = 'filled',
  ...rest
}: Props) => (
  <BaseButton
    className={clsx(styles[variant], styles[color], styles[size], className)}
    {...rest}
  >
    {children}
  </BaseButton>
)
