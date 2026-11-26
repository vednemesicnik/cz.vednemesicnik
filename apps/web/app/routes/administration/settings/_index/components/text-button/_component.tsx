import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import { BaseButton } from '~/components/base-button'

import styles from './_styles.module.css'

type Props = ComponentProps<'button'>

/**
 * A button that reads as a link, for the quieter row actions of design 29a
 * (`Odebrat…`, `Vypnout…`, `Odebrat` at the photo): each takes a sign-in
 * method away or opens its own dialog, so it carries no weight of a button.
 */
export const TextButton = ({ className, type = 'button', ...rest }: Props) => (
  <BaseButton
    className={clsx(styles.textButton, className)}
    type={type}
    {...rest}
  />
)
