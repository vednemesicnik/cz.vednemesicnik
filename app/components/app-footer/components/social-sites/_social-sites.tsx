import { BaseHyperlink } from "~/components/base-hyperlink"
import { FacebookIcon, InstagramIcon } from "~/components/social-site-icons"

import styles from "./_social-sites.module.css"

export const SocialSites = () => {
  return (
    <section className={styles.container}>
      <h2 className={"screen-reader-only"}>Sociální sítě</h2>
      <ul className={styles.list}>
        <li className={styles.listItem}>
          <BaseHyperlink
            title={"Instagram"}
            href={"https://www.instagram.com/vednemesicnik/"}
            className={styles.link}
          >
            <span className={"screen-reader-only"}>Instagram</span>
            <InstagramIcon className={styles.logo} />
          </BaseHyperlink>
        </li>
        <li className={styles.listItem}>
          <BaseHyperlink
            title={"Facebook"}
            href={"https://www.facebook.com/vednemesicnik"}
            className={styles.link}
          >
            <span className={"screen-reader-only"}>Facebook</span>
            <FacebookIcon className={styles.logo} />
          </BaseHyperlink>
        </li>
      </ul>
    </section>
  )
}

SocialSites.displayName = "SocialSites"
