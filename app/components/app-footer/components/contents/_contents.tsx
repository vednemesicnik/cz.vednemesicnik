import { Link } from "@remix-run/react"
import type { LinksFunction } from "@remix-run/node"
import styles from "./_contents.css"

export const Contents = () => {
  return (
    <section className={"app-footer--contents"}>
      <h2 className={"app-footer--contents--title"}>Obsah webu</h2>
      <ul className={"app-footer--contents--list"}>
        <li className={"app-footer--contents--list-item"}>
          <Link to={"/archive"} className={"app-footer--contents--list-item--link"}>
            Archiv
          </Link>
        </li>
        <li className={"app-footer--contents--list-item"}>
          <Link to={"/editorial-board"} className={"app-footer--contents--list-item--link"}>
            Redakce
          </Link>
        </li>
        <li className={"app-footer--contents--list-item"}>
          <Link to={"/organization"} className={"app-footer--contents--list-item--link"}>
            Spolek
          </Link>
        </li>
        <li className={"app-footer--contents--list-item"}>
          <Link to={"/podcast"} className={"app-footer--contents--list-item--link"}>
            Podcast
          </Link>
        </li>
      </ul>
    </section>
  )
}

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }]
