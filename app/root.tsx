// noinspection JSUnusedGlobalSymbols,HtmlRequiredTitleElement

import type { ReactNode } from "react"
import {
  href,
  isRouteErrorResponse,
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
import "~/styles/admin-tokens.css"

import type { Route } from "./+types/root"

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
        <script src={href("/resources/env.js")} />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </>
    )
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    )
  } else {
    return <h1>Unknown Error</h1>
  }
}
