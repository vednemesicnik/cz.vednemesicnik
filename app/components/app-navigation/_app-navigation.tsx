import { NavLink } from "@remix-run/react"
import type { LinksFunction } from "@remix-run/node"
import styles from "./_app-navigation.css"

export const AppNavigation = () => {
  return (
    <nav className={"app-navigation"}>
      <ul className={"app-navigation--list"}>
        <li className={"app-navigation--list-item"}>
          <NavLink
            className={({ isActive }) =>
              `app-navigation--list-item--link ${isActive ? "app-navigation--list-item--link--active" : ""}`
            }
            to={"/archive"}
          >
            Archiv
          </NavLink>
        </li>
        <li className={"app-navigation--list-item"}>
          <NavLink
            className={({ isActive }) =>
              `app-navigation--list-item--link ${isActive ? "app-navigation--list-item--link--active" : ""}`
            }
            to={"/podcast"}
          >
            Podcast
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }]
