// noinspection JSUnusedGlobalSymbols,HtmlRequiredTitleElement

import type { ReactNode } from "react"
import {
  href,
  Links,
  type LinksFunction,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router"

import "~/styles/global.css"
import "~/styles/colors.css"
import "~/styles/fonts.css"
import "~/styles/sizes.css"

export const links: LinksFunction = () => [
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "alternate icon", href: "/favicon.ico" },
]

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="cs-CZ">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />

        {/* Environment variables body script - sets ENV for client */}
        <script src={href("/resources/env-script")} />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}
