import styles from './_styles.module.css'
import { ComplementaryInformation } from './components/complementary-information'
import { SiteContent } from './components/site-content'

export const AppFooter = () => {
  return (
    <footer className={styles.container}>
      <section className={styles.content}>
        <SiteContent />
        <ComplementaryInformation />
      </section>
    </footer>
  )
}

AppFooter.displayName = 'AppFooter'
