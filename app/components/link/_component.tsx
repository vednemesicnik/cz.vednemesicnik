import { clsx } from 'clsx'
import type { ComponentProps, JSX } from 'react'
import { BaseLink } from '~/components/base-link'
import styles from './_styles.module.css'

type Props = ComponentProps<typeof BaseLink>

export const Link = ({ children, className, ...rest }: Props): JSX.Element => {
  return (
    <BaseLink className={clsx(styles.link, className)} {...rest}>
      {children}
    </BaseLink>
  )
}
