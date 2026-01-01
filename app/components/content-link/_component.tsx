import type { ReactNode } from 'react'

import { BaseLink } from '~/components/base-link'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  to: string
}

export const ContentLink = ({ children, to }: Props) => {
  return (
    <BaseLink className={styles.link} to={to}>
      <article className={styles.article}>{children}</article>
    </BaseLink>
  )
}
