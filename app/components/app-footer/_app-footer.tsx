import styles from "./_app-footer.module.css"
import { SiteContent } from "./components/site-content"
import { SocialSites } from "./components/social-sites"
import { ComplementaryInformation } from "./components/complementary-information"
import { combineStyles } from "~/utils/combine-styles"
import { applyStyles } from "~/utils/apply-styles"

type Props = {
  children?: never
  isInEditMode: boolean
}

export const AppFooter = ({ isInEditMode }: Props) => {
  return (
    <footer className={combineStyles(styles.container, applyStyles(styles.edit_mode).if(isInEditMode))}>
      <section className={styles.content}>
        <SiteContent />
        <SocialSites />
        <ComplementaryInformation />
      </section>
    </footer>
  )
}

AppFooter.displayName = "AppFooter"
