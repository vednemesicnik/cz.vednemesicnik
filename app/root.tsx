// noinspection JSUnusedGlobalSymbols,HtmlRequiredTitleElement

import type { ReactNode } from 'react'
import {
  href,
  isRouteErrorResponse,
  Links,
  type LinksFunction,
  Meta,
  Outlet,
  redirect,
  Scripts,
  ScrollRestoration,
} from 'react-router'

import '~/styles/global.css'
import '~/styles/colors.css'
import '~/styles/fonts.css'
import '~/styles/sizes.css'

import type { Route } from './+types/root'

export const links: LinksFunction = () => [
  { href: '/favicon.svg', rel: 'icon', type: 'image/svg+xml' },
  { href: '/favicon.ico', rel: 'alternate icon' },
  { href: 'https://rsms.me/', rel: 'preconnect' },
  { href: 'https://rsms.me/inter/inter.css', rel: 'stylesheet' },
]

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const baseUrl = new URL(process.env.BASE_URL)

  // Redirect www to non-www if BASE_URL doesn't include www
  if (url.hostname.startsWith('www.') && !baseUrl.hostname.startsWith('www.')) {
    url.hostname = baseUrl.hostname
    url.protocol = baseUrl.protocol
    url.port = baseUrl.port
    return redirect(url.href, 301)
  }

  // Remove trailing slashes (except for homepage)
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/$/, '')
    return redirect(url.href, 301)
  }

  return null
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="cs-CZ">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />

        {/* Environment variables body script - sets ENV for client */}
        <script src={href('/resources/env.js')} />
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
