import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import { BaseLink } from '~/components/base-link'

import styles from './_styles.module.css'

type Props = ComponentProps<typeof BaseLink> & {
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'filled' | 'outline'
}

export const LinkButton = ({
  children,
  className,
  disabled = false,
  size = 'md',
  variant = 'outline',
  ...rest
}: Props) => {
  const mergedClassName = clsx(
    styles.linkButton,
    size === 'sm' && styles.sm,
    size === 'lg' && styles.lg,
    variant === 'filled' && styles.filled,
    disabled && styles.disabled,
    className,
  )

  if (disabled) {
    return (
      <span aria-disabled="true" className={mergedClassName}>
        {children}
      </span>
    )
  }

  return (
    <BaseLink className={mergedClassName} {...rest}>
      {children}
    </BaseLink>
  )
}
