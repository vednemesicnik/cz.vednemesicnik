import styles from "./_app-footer.module.css"
import { SiteContent } from "./components/site-content"
import { SocialSites } from "./components/social-sites"
import { ComplementaryInformation } from "./components/complementary-information"

export const AppFooter = () => {
  return (
    <footer className={styles.container}>
      <section className={styles.content}>
        <SiteContent />
        <SocialSites />
        <ComplementaryInformation />
      </section>
    </footer>
  )
}

AppFooter.displayName = "AppFooter"
