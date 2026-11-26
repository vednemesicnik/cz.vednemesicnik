import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { BaseLink } from '~/components/base-link'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  to: string
  isPreview?: boolean
}

/**
 * An article's card in a list.
 *
 * @param props.isPreview - Outlined, for an article the reader doesn't see (10d).
 */
export const PostContentLink = ({ children, to, isPreview }: Props) => {
  return (
    <BaseLink className={styles.link} to={to}>
      <article className={clsx(styles.article, isPreview && styles.preview)}>
        {children}
      </article>
    </BaseLink>
  )
}
