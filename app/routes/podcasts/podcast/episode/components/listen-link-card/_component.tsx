import type { ReactNode } from 'react'
import { BaseHyperlink } from '~/components/base-hyperlink'
import { OpenInNewIcon } from '~/components/icons/open-in-new-icon'
import { formatLinkHost } from '~/utils/podcast-episode/format-link-host'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  href: string
}

/**
 * One platform under *Kde poslouchat* (design 13c): a full-width card with the
 * label on the left and the domain with the new-tab icon on the right, only the
 * icon below 640 px. It opens the platform in a new tab. Screen readers hear
 * *Spotify (otevře se v nové záložce)*, without the domain (m18z9bn0).
 *
 * @param children - The label the editor stored: the platform's name (27d)
 * @returns The list item with the card
 */
export const ListenLinkCard = ({ children, href }: Props) => {
  const host = formatLinkHost(href)

  return (
    <li className={styles.item}>
      <BaseHyperlink className={styles.card} href={href}>
        <span className={styles.label}>{children}</span>
        <span aria-hidden={true} className={styles.trailing}>
          {host !== null && <span className={styles.host}>{host}</span>}
          <OpenInNewIcon />
        </span>
        <span className={'screen-reader-only'}>
          {' '}
          (otevře se v nové záložce)
        </span>
      </BaseHyperlink>
    </li>
  )
}
