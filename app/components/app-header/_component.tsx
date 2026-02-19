import type { ReactNode } from 'react'
import { href } from 'react-router'
import { HomeLink } from '~/components/app-header/components/home-link'
import { Navigation } from '~/components/app-header/components/navigation'
import { NavigationItem } from '~/components/app-header/components/navigation-item'
import styles from './_styles.module.css'

type Props = {
  children?: ReactNode
  isInEditMode?: boolean
}

export const AppHeader = ({ children, isInEditMode = false }: Props) => {
  return (
    <header className={styles.container}>
      {children}
      <section className={styles.content}>
        <HomeLink isInEditMode={isInEditMode} />
        <Navigation>
          <NavigationItem to={href('/articles')}>Články</NavigationItem>
          <NavigationItem to={href('/podcasts')}>Podcasty</NavigationItem>
          <NavigationItem to={href('/archive')}>Archiv</NavigationItem>
          <NavigationItem to={href('/editorial-board')}>Redakce</NavigationItem>
        </Navigation>
      </section>
    </header>
  )
}

AppHeader.displayName = 'AppHeader'
