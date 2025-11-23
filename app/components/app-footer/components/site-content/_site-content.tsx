import { BaseLink } from "~/components/base-link"

import styles from "./_site-content.module.css"

export const SiteContent = () => {
  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Obsah webu</h2>
      <ul className={styles.list}>
        <li className={styles.listItem}>
          <BaseLink to={"/archive"} className={styles.link}>
            Archiv
          </BaseLink>
        </li>
        <li className={styles.listItem}>
          <BaseLink to={"/articles"} className={styles.link}>
            Články
          </BaseLink>
        </li>
        <li className={styles.listItem}>
          <BaseLink to={"/podcasts"} className={styles.link}>
            Podcasty
          </BaseLink>
        </li>
        <li>
          <BaseLink to={"/support"} className={styles.link}>
            Podpora
          </BaseLink>
        </li>
        <li className={styles.listItem}>
          <BaseLink to={"/editorial-board"} className={styles.link}>
            Redakce
          </BaseLink>
        </li>
        <li className={styles.listItem}>
          <BaseLink to={"/organization"} className={styles.link}>
            Spolek
          </BaseLink>
        </li>
      </ul>
    </section>
  )
}

SiteContent.displayName = "SiteContent"
