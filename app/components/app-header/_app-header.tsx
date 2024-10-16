import type { ReactNode } from "react"

import { HomeLink } from "~/components/app-header/components/home-link"
import { Navigation } from "~/components/app-header/components/navigation"
import { NavigationItem } from "~/components/app-header/components/navigation-item"

import styles from "./_app-header.module.css"

type Props = {
  children: ReactNode
  isInEditMode: boolean
}

export const AppHeader = ({ children, isInEditMode }: Props) => {
  return (
    <header className={styles.container}>
      {children}
      <section className={styles.content}>
        <HomeLink isInEditMode={isInEditMode} />
        <Navigation>
          <NavigationItem to={"/articles"}>Články</NavigationItem>
          <NavigationItem to={"/podcasts"}>Podcasty</NavigationItem>
          <NavigationItem to={"/archive"}>Archiv</NavigationItem>
          <NavigationItem to={"/editorial-board"}>Redakce</NavigationItem>
        </Navigation>
      </section>
    </header>
  )
}

AppHeader.displayName = "AppHeader"
