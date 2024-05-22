import styles from "./_app-footer.module.css"
import { SiteContent } from "./components/site-content"
import { SocialSites } from "./components/social-sites"
import { ComplementaryInformation } from "./components/complementary-information"
import { applyClasses, combineClasses } from "@liborgabrhel/style-utils"

type Props = {
  children?: never
  isInEditMode: boolean
}

export const AppFooter = ({ isInEditMode }: Props) => {
  return (
    <footer className={combineClasses(styles.container, applyClasses(styles.edit_mode).if(isInEditMode))}>
      <section className={styles.content}>
        <SiteContent />
        <SocialSites />
        <ComplementaryInformation />
      </section>
    </footer>
  )
}

AppFooter.displayName = "AppFooter"
