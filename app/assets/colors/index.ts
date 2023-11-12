import type { LinksFunction } from "@remix-run/node"
import styles from "./_colors.css"

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }]
