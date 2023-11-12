import type { ReactNode } from "react"
import type { LinksFunction } from "@remix-run/node"

import styles from "./_app-layout.css"

type Props = {
  children: ReactNode
}

export const AppLayout = ({ children }: Props) => {
  return <body className={"app-layout"}>{children}</body>
}

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }]
