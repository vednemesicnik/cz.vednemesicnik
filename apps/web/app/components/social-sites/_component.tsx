import { clsx } from 'clsx'

import { BaseHyperlink } from '~/components/base-hyperlink'
import { FacebookIcon } from '~/components/icons/facebook-icon'
import { InstagramIcon } from '~/components/icons/instagram-icon'
import { socialSitesConfig } from '~/config/social-sites-config'

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
            href={socialSitesConfig.instagram.href}
            title={socialSitesConfig.instagram.label}
          >
            <span className={'screen-reader-only'}>
              {socialSitesConfig.instagram.label}
            </span>
            <InstagramIcon className={styles.logo} />
          </BaseHyperlink>
        </li>
        <li className={styles.listItem}>
          <BaseHyperlink
            className={styles.link}
            href={socialSitesConfig.facebook.href}
            title={socialSitesConfig.facebook.label}
          >
            <span className={'screen-reader-only'}>
              {socialSitesConfig.facebook.label}
            </span>
            <FacebookIcon className={styles.logo} />
          </BaseHyperlink>
        </li>
      </ul>
    </section>
  )
}

SocialSites.displayName = 'SocialSites'
