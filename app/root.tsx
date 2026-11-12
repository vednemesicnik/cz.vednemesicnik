// noinspection JSUnusedGlobalSymbols,HtmlRequiredTitleElement

import type { ReactNode } from 'react'
import {
  Links,
  type LinksFunction,
  Meta,
  Outlet,
  redirect,
  Scripts,
  ScrollRestoration,
} from 'react-router'

import '~/styles/global.css'
import '~/styles/primitive-tokens.css'
import '~/styles/semantic-tokens.css'
import '~/styles/fonts.css'
import '~/styles/sizes.css'

// After the global styles, so global.css declares the cascade layer order first.
import { RootBoundaryError } from '~/components/root-boundary-error'
import { ENV_META_NAME } from '~/config/env-meta-config'
import { useColorScheme } from '~/hooks/use-color-scheme'
import { useNavigationTrail } from '~/hooks/use-navigation-trail'
import interVariableFontUrl from '~/styles/fonts/inter-variable.woff2'
import { getColorSchemeMetaContent } from '~/utils/get-color-scheme-meta-content'
import { getScrollRestorationKey } from '~/utils/navigation-trail/get-scroll-restoration-key'

import type { Route } from './+types/root'

// A return up to a list takes the list's scroll position (30i).
const getScrollKey = (
  location: Parameters<typeof getScrollRestorationKey>[0],
) => getScrollRestorationKey(location)

export const links: LinksFunction = () => [
  { href: '/favicon.svg', rel: 'icon', type: 'image/svg+xml' },
  { href: '/favicon.ico', rel: 'alternate icon' },
  {
    as: 'font',
    crossOrigin: 'anonymous',
    href: interVariableFontUrl,
    rel: 'preload',
    type: 'font/woff2',
  },
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
  // global.css mirrors the meta into color-scheme (design 29a, #560).
  const colorScheme = useColorScheme()

  return (
    <html lang="cs-CZ">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta
          content={getColorSchemeMetaContent(colorScheme)}
          name="color-scheme"
        />
        {/* The browser's window.ENV, read from here by initEnvClient (log 0063). ENV is
            the server's global, and in the browser what that set from this tag, so
            hydration sees the same content. */}
        <meta content={JSON.stringify(ENV)} name={ENV_META_NAME} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration getKey={getScrollKey} />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  useNavigationTrail()

  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RootBoundaryError error={error} />
}
