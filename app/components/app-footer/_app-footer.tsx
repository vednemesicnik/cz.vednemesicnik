import { Divider } from "~/components/divider"

import styles from "./_app-footer.module.css"
import { ComplementaryInformation } from "./components/complementary-information"
import { SiteContent } from "./components/site-content"
import { SocialSites } from "./components/social-sites"

export const AppFooter = () => {
  return (
    <footer className={styles.container}>
      <Divider />
      <section className={styles.content}>
        <SiteContent />
        <SocialSites />
        <ComplementaryInformation />
      </section>
    </footer>
  )
}

AppFooter.displayName = "AppFooter"
