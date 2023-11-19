import { FacebookIcon, InstagramIcon } from "~/components/social-site-icons"
import styles from "./_social-sites.module.css"

export const SocialSites = () => {
  return (
    <section className={styles.container}>
      <ul className={styles.list}>
        <li className={styles.listItem}>
          <a title={"Facebook"} href={"https://www.facebook.com/vednemesicnik"} className={styles.link}>
            <FacebookIcon className={styles.logo} />
          </a>
        </li>
        <li className={styles.listItem}>
          <a title={"Instagram"} href={"https://www.instagram.com/vednemesicnik/"} className={styles.link}>
            <InstagramIcon className={styles.logo} />
          </a>
        </li>
      </ul>
    </section>
  )
}

SocialSites.displayName = "SocialSites"
