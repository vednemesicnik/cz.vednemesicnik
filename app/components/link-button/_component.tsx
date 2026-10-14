import { clsx } from 'clsx'
import type { ComponentProps, MouseEvent } from 'react'

import baseButtonStyles from '~/components/base-button/_styles.module.css'
import { BaseLink } from '~/components/base-link'
import type { Size, Variant } from '~/components/button'
import buttonStyles from '~/components/button/_styles.module.css'

import styles from './_styles.module.css'

type Props = ComponentProps<typeof BaseLink> & {
  variant?: Variant
  size?: Size
  disabled?: boolean
}

/**
 * The design system's `Button` with an `href`: a React Router link that looks
 * like a button, sharing `Button`'s stylesheet.
 *
 * @param props.variant - `primary` for the main action, `outline` for a side
 * action, `ghost` for a secondary way out; the same variants as `Button`.
 * @param props.size - `sm` in rows and dialogs, `md` by default, `lg` for a
 * prominent call to action.
 * @param props.disabled - Marks the link `aria-disabled` and swallows the
 * click, as a link has no `disabled` attribute.
 */
export const LinkButton = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled,
  onClick,
  ...rest
}: Props) => {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  return (
    <BaseLink
      aria-disabled={disabled}
      className={clsx(
        baseButtonStyles.button,
        buttonStyles.button,
        buttonStyles[variant],
        buttonStyles[size],
        styles.linkButton,
        className,
      )}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </BaseLink>
  )
}
