import { Link } from "@remix-run/react"
import styles from "./_site-content.module.css"

export const SiteContent = () => {
  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Obsah webu</h2>
      <ul className={styles.list}>
        <li className={styles.listItem}>
          <Link to={"/archive"} className={styles.link}>
            Archiv
          </Link>
        </li>
        <li className={styles.listItem}>
          <Link to={"/editorial-board"} className={styles.link}>
            Redakce
          </Link>
        </li>
        <li className={styles.listItem}>
          <Link to={"/organization"} className={styles.link}>
            Spolek
          </Link>
        </li>
        <li className={styles.listItem}>
          <Link to={"/podcast"} className={styles.link}>
            Podcast
          </Link>
        </li>
      </ul>
    </section>
  )
}

SiteContent.displayName = "SiteContent"
