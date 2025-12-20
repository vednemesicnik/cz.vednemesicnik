import { BaseLink } from '~/components/base-link'

import styles from './_site-content.module.css'

export const SiteContent = () => {
  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Obsah webu</h2>
      <ul className={styles.list}>
        <li className={styles.listItem}>
          <BaseLink className={styles.link} to={'/archive'}>
            Archiv
          </BaseLink>
        </li>
        <li className={styles.listItem}>
          <BaseLink className={styles.link} to={'/articles'}>
            Články
          </BaseLink>
        </li>
        <li className={styles.listItem}>
          <BaseLink className={styles.link} to={'/podcasts'}>
            Podcasty
          </BaseLink>
        </li>
        <li>
          <BaseLink className={styles.link} to={'/support'}>
            Podpora
          </BaseLink>
        </li>
        <li className={styles.listItem}>
          <BaseLink className={styles.link} to={'/editorial-board'}>
            Redakce
          </BaseLink>
        </li>
        <li className={styles.listItem}>
          <BaseLink className={styles.link} to={'/organization'}>
            Spolek
          </BaseLink>
        </li>
      </ul>
    </section>
  )
}

SiteContent.displayName = 'SiteContent'
