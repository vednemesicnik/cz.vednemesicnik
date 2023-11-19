// noinspection HtmlRequiredTitleElement,JSUnusedGlobalSymbols

import type { LinksFunction } from "@remix-run/node"
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react"
import { cssBundleHref } from "@remix-run/css-bundle"

// App Custom Components
import { AppLayout } from "~/components/app-layout"
import { AppHeader } from "~/components/app-header"
import { AppBody } from "~/components/app-body"
import { AppFooter } from "~/components/app-footer"
import { AppNavigation } from "~/components/app-navigation"

// Stand-alone Styles
import "~/styles/global.module.css"
import "~/styles/fonts.module.css"
import "~/styles/sizes.module.css"
import "~/styles/colors.modules.css"

export default function App() {
  return (
    <html lang="cs-CZ">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <AppLayout>
        <AppHeader />
        <AppNavigation />
        <AppBody>
          <Outlet />
        </AppBody>
        <AppFooter />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </AppLayout>
    </html>
  )
}

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "alternate icon", href: "/favicon.ico" },
]
