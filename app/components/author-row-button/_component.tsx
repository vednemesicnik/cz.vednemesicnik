import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import { Button } from '~/components/button'

import styles from './_styles.module.css'

type Props = Omit<ComponentProps<'button'>, 'type'>

/**
 * A worded action at the end of an `AuthorRow` (design 24j, 28f): *Vyměnit*
 * for the only author, *Změnit* for a new account's author, *Zrušit* while
 * replacing. The row shortens around it.
 */
export const AuthorRowButton = ({ className, children, ...rest }: Props) => (
  <Button
    className={clsx(styles.action, className)}
    data-author-row-button={''}
    size={'sm'}
    type={'button'}
    variant={'ghost'}
    {...rest}
  >
    {children}
  </Button>
)
