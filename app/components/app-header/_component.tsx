import type { ReactNode } from 'react'
import { href } from 'react-router'
import { HomeLink } from '~/components/app-header/components/home-link'
import { Navigation } from '~/components/app-header/components/navigation'
import { NavigationItem } from '~/components/app-header/components/navigation-item'
import styles from './_styles.module.css'

type Props = {
  children?: ReactNode
}

/**
 * The public site's header: the logo and the navigation, then whatever the
 * layout passes under them, such as the preview bar (10d).
 */
export const AppHeader = ({ children }: Props) => {
  return (
    <header className={styles.container}>
      <section className={styles.content}>
        <HomeLink />
        <Navigation>
          <NavigationItem to={href('/articles')}>Články</NavigationItem>
          <NavigationItem to={href('/podcasts')}>Podcasty</NavigationItem>
          <NavigationItem to={href('/archive')}>Archiv</NavigationItem>
          <NavigationItem to={href('/editorial-board')}>Redakce</NavigationItem>
        </Navigation>
      </section>
      {children}
    </header>
  )
}

AppHeader.displayName = 'AppHeader'
