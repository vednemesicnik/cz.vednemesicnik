// noinspection HtmlRequiredTitleElement,JSUnusedGlobalSymbols

import { cssBundleHref } from "@remix-run/css-bundle"
import type { LinksFunction } from "@remix-run/node"
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react"
import { links as sizesLinks } from "app/assets/sizes"
import { links as fontLinks } from "~/assets/font"
import { links as colorsLinks } from "~/assets/colors"
import { AppLayout, links as appLayoutLinks } from "app/components/app-layout"
import { AppHeader, links as appHeaderLinks } from "~/components/app-header"
import { AppBody, links as appBodyLinks } from "~/components/app-body"
import { AppFooter, links as appFooterLinks } from "~/components/app-footer"
import { AppNavigation, links as appNavigationLinks } from "~/components/app-navigation"

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
        <AppHeader>
          <AppNavigation />
        </AppHeader>
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
  ...sizesLinks(),
  ...fontLinks(),
  ...colorsLinks(),
  ...appLayoutLinks(),
  ...appHeaderLinks(),
  ...appNavigationLinks(),
  ...appBodyLinks(),
  ...appFooterLinks(),
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "alternate icon", href: "/favicon.ico" },
]
