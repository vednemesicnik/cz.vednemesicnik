import type { ReactNode } from "react"
import styles from "./_page.css"
import type { LinksFunction } from "@remix-run/node"

type Props = {
  children: ReactNode
}

export const Page = ({ children }: Props) => {
  return <section className={"page"}>{children}</section>
}

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }]
