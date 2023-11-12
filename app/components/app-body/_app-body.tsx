import type { LinksFunction } from "@remix-run/node"
import styles from "./_app-body.css"
import type { ReactNode } from "react"

type Props = {
  children: ReactNode
}

export const AppBody = ({ children }: Props) => {
  return <main className={"app-body"}>{children}</main>
}

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }]
