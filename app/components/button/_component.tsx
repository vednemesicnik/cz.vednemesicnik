import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import { BaseButton } from '~/components/base-button'

import styles from './_styles.module.css'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

type Size = 'sm' | 'md' | 'lg'

type Props = ComponentProps<'button'> & {
  variant?: Variant
  size?: Size
}

/**
 * The design system's `Button`, one for the public web and the administration.
 *
 * @param props.variant - `primary` for the main action, `secondary` filled
 * amber, `outline` for a side action, `ghost` for Zrušit, `danger` for a
 * destructive action.
 * @param props.size - `sm` in dialogs and toolbars, `md` by default, `lg` for
 * a prominent call to action.
 */
export const Button = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...rest
}: Props) => (
  <BaseButton
    className={clsx(styles.button, styles[variant], styles[size], className)}
    {...rest}
  >
    {children}
  </BaseButton>
)
