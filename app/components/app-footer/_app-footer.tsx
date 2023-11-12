import type { LinksFunction } from "@remix-run/node"
import styles from "./_app-footer.css"
import { Contents, links as contentsLinks } from "./components/contents"
import { SocialSites, links as socialSitesLinks } from "./components/social-sites"
import { Description, links as descriptionLinks } from "./components/description"

export const AppFooter = () => {
  return (
    <footer className={"app-footer"}>
      <section className={"app-footer-content"}>
        <Contents />
        <SocialSites />
        <Description />
      </section>
    </footer>
  )
}

export const links: LinksFunction = () => [
  ...contentsLinks(),
  ...socialSitesLinks(),
  ...descriptionLinks(),
  { rel: "stylesheet", href: styles },
]
