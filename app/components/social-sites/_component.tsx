import { clsx } from 'clsx'

import { BaseHyperlink } from '~/components/base-hyperlink'
import { FacebookIcon } from '~/components/icons/facebook-icon'
import { InstagramIcon } from '~/components/icons/instagram-icon'

import styles from './_styles.module.css'

type Props = {
  className?: string
}

export const SocialSites = ({ className }: Props) => {
  return (
    <section className={clsx(styles.container, className)}>
      <h2 className={'screen-reader-only'}>Sociální sítě</h2>
      <ul className={styles.list}>
        <li className={styles.listItem}>
          <BaseHyperlink
            className={styles.link}
            href={'https://www.instagram.com/vednemesicnik/'}
            title={'Instagram'}
          >
            <span className={'screen-reader-only'}>Instagram</span>
            <InstagramIcon className={styles.logo} />
          </BaseHyperlink>
        </li>
        <li className={styles.listItem}>
          <BaseHyperlink
            className={styles.link}
            href={'https://www.facebook.com/vednemesicnik'}
            title={'Facebook'}
          >
            <span className={'screen-reader-only'}>Facebook</span>
            <FacebookIcon className={styles.logo} />
          </BaseHyperlink>
        </li>
      </ul>
    </section>
  )
}

SocialSites.displayName = 'SocialSites'
