import { FacebookIcon, InstagramIcon } from "~/components/social-site-icons"
import type { LinksFunction } from "@remix-run/node"
import styles from "./_social-sites.css"

export const SocialSites = () => {
  return (
    <section className={"app-footer--social-sites"}>
      <ul className={"app-footer--social-sites--list"}>
        <li className={"app-footer--social-sites--list-item"}>
          <a
            title={"Facebook"}
            href={"https://www.facebook.com/vednemesicnik"}
            className={"app-footer--social-sites--link"}
          >
            <FacebookIcon />
          </a>
        </li>
        <li className={"app-footer--social-sites--list-item"}>
          <a
            title={"Instagram"}
            href={"https://www.instagram.com/vednemesicnik/"}
            className={"app-footer--social-sites--link"}
          >
            <InstagramIcon />
          </a>
        </li>
      </ul>
    </section>
  )
}

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }]
