import { Divider } from '~/components/divider'
import { SocialSites } from '~/components/social-sites'

import styles from './_styles.module.css'
import { ComplementaryInformation } from './components/complementary-information'
import { SiteContent } from './components/site-content'

export const AppFooter = () => {
  return (
    <footer className={styles.container}>
      <Divider />
      <section className={styles.content}>
        <SiteContent />
        <SocialSites className={styles.socialSites} />
        <ComplementaryInformation />
      </section>
    </footer>
  )
}

AppFooter.displayName = 'AppFooter'
