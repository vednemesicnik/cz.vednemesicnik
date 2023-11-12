import type { ReactNode } from "react"
import type { LinksFunction } from "@remix-run/node"

import styles from "./_app-header.css"
import { VdmLogo } from "~/components/vdm-logo"
import { NavLink } from "@remix-run/react"

type Props = {
  children: ReactNode
}
export const AppHeader = ({ children }: Props) => {
  return (
    <header className={"app-header"}>
      <NavLink to={"/"} className={"app-header--name"}>
        <VdmLogo width={"40px"} height={"40px"} />
        <h1 className={"app-header--heading"}>Vedneměsíčník</h1>
      </NavLink>
      <section className={"app-header--navigation"}>{children}</section>
    </header>
  )
}

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }]
