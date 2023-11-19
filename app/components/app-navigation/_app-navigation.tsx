import { NavLink } from "@remix-run/react"
import styles from "./_app-navigation.module.css"
import { combineStyles } from "~/utils/combine-styles"
import { applyStyles } from "~/utils/apply-styles"
import { useLayoutEffect, useState } from "react"

export const AppNavigation = () => {
  const [isSticky, setIsSticky] = useState(false)

  useLayoutEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 60
      setIsSticky(isScrolled)
    }

    window.addEventListener("scroll", handleScroll)

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav className={combineStyles(styles.container, applyStyles(styles.sticky).if(isSticky))}>
      <section className={styles.content}>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <NavLink
              className={({ isActive }) => combineStyles(styles.link, applyStyles(styles.activeLink).if(isActive))}
              to={"/archive"}
            >
              Archiv
            </NavLink>
          </li>
          <li className={styles.listItem}>
            <NavLink
              className={({ isActive }) => combineStyles(styles.link, applyStyles(styles.activeLink).if(isActive))}
              to={"/podcast"}
            >
              Podcast
            </NavLink>
          </li>
        </ul>
      </section>
    </nav>
  )
}

AppNavigation.displayName = "AppNavigation"
