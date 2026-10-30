import type { ReactNode } from 'react'

import { BaseLink } from '~/components/base-link'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  to: string
}

/** The bar's action as a link, such as „Zobrazit v administraci“ (10d). */
export const PreviewBarLink = ({ children, to }: Props) => (
  <BaseLink className={styles.link} prefetch={'none'} to={to}>
    {children}
  </BaseLink>
)
