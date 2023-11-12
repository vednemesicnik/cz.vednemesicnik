import type { LinksFunction } from "@remix-run/node"
import styles from "~/components/app-footer/components/description/_description.css"
import logoCB from "~/components/app-footer/components/description/assets/logo-cb.png"

export const Description = () => {
  return (
    <section className={"app-footer--description"}>
      <section className={"app-footer--description-sponsor"}>
        <img className={"app-footer--description-sponsor--logo"} src={logoCB} alt={"Logo Českých Budějovic"} />
        <p className={"app-footer--description-sponsor--text"}>
          Vedneměsíčník je spolufinancován Statutárním městem České Budějovice
        </p>
      </section>
      <p className={"app-footer--description-text"}>Webové stránky provozuje Vedneměsíčník, z. s. IČO: 22851356</p>
    </section>
  )
}

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }]
