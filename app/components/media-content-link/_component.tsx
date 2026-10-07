import type { ReactNode } from 'react'

import { BaseLink } from '~/components/base-link'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  to: string
}

/**
 * The card for media with a square cover, such as a podcast episode: the
 * `ContentLinkCover` on the left, beside the text at every width (design 13e,
 * aec7mifb). Articles use `PostContentLink`.
 */
export const MediaContentLink = ({ children, to }: Props) => {
  return (
    <BaseLink className={styles.link} to={to}>
      <article className={styles.article}>{children}</article>
    </BaseLink>
  )
}
