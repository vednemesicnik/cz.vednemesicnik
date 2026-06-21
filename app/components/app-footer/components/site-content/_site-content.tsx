import { href } from 'react-router'
import { BaseLink } from '~/components/base-link'
import styles from './_site-content.module.css'

export const SiteContent = () => {
  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Obsah webu</h2>
      <ul className={styles.list}>
        <li className={styles.listItem}>
          <BaseLink className={styles.link} to={href('/archive')}>
            Archiv
          </BaseLink>
        </li>
        <li className={styles.listItem}>
          <BaseLink className={styles.link} to={href('/articles')}>
            Články
          </BaseLink>
        </li>
        <li className={styles.listItem}>
          <BaseLink className={styles.link} to={href('/podcasts')}>
            Podcasty
          </BaseLink>
        </li>
        <li>
          <BaseLink className={styles.link} to={href('/support')}>
            Podpora
          </BaseLink>
        </li>
        <li className={styles.listItem}>
          <BaseLink className={styles.link} to={href('/editorial-board')}>
            Redakce
          </BaseLink>
        </li>
        <li className={styles.listItem}>
          <BaseLink className={styles.link} to={href('/organization')}>
            Spolek
          </BaseLink>
        </li>
        <li className={styles.listItem}>
          <BaseLink className={styles.link} to={href('/grants')}>
            Dotace
          </BaseLink>
        </li>
        <li className={styles.listItem}>
          <BaseLink className={styles.link} to={href('/donate')}>
            Darovat
          </BaseLink>
        </li>
      </ul>
    </section>
  )
}

SiteContent.displayName = 'SiteContent'
