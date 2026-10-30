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
 * The card for media with a square cover, such as a podcast episode: the
 * `ContentLinkCover` on the left, beside the text at every width (design 13e,
 * aec7mifb). Articles use `PostContentLink`.
 *
 * @param props.isPreview - Outlined, for media the reader doesn't see (10d).
 */
export const MediaContentLink = ({ children, to, isPreview }: Props) => {
  return (
    <BaseLink className={styles.link} to={to}>
      <article className={clsx(styles.article, isPreview && styles.preview)}>
        {children}
      </article>
    </BaseLink>
  )
}
