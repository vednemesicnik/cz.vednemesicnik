import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = ComponentProps<'button'>

/**
 * An action in or under text, drawn as the design system's `Link` (0zgyl1ao):
 * a button, as it does something rather than going somewhere, e.g. *Zkusit
 * znovu*, *Obnovit podle názvu*. A plain `<button>`, so no button look has to
 * be undone; it takes the size of the text around it.
 */
export const ButtonLink = ({
  children,
  className,
  type = 'button',
  ...rest
}: Props) => (
  <button className={clsx(styles.buttonLink, className)} type={type} {...rest}>
    {children}
  </button>
)
