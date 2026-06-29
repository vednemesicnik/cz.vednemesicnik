import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { BaseLink } from '~/components/base-link'
import { ArrowLeftAltIcon } from '~/components/icons/arrow-left-alt-icon'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
  to: string
}

export const BackLink = ({ children, className, to }: Props) => (
  <BaseLink className={clsx(styles.backLink, className)} to={to}>
    <ArrowLeftAltIcon />
    {children}
  </BaseLink>
)
