import { Hyperlink } from "~/components/hyperlink"
import { FacebookIcon, InstagramIcon } from "~/components/social-site-icons"

import styles from "./_social-sites.module.css"

export const SocialSites = () => {
  return (
    <section className={styles.container}>
      <h2 className={"screen-reader-only"}>Sociální sítě</h2>
      <ul className={styles.list}>
        <li className={styles.listItem}>
          <Hyperlink
            title={"Instagram"}
            to={"https://www.instagram.com/vednemesicnik/"}
            className={styles.link}
            hasIcon={false}
          >
            <span className={"screen-reader-only"}>Instagram</span>
            <InstagramIcon className={styles.logo} />
          </Hyperlink>
        </li>
        <li className={styles.listItem}>
          <Hyperlink
            title={"Facebook"}
            to={"https://www.facebook.com/vednemesicnik"}
            className={styles.link}
            hasIcon={false}
          >
            <span className={"screen-reader-only"}>Facebook</span>
            <FacebookIcon className={styles.logo} />
          </Hyperlink>
        </li>
      </ul>
    </section>
  )
}

SocialSites.displayName = "SocialSites"
