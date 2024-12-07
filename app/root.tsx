// noinspection HtmlRequiredTitleElement,JSUnusedGlobalSymbols

import {
  data,
  Links,
  type LinksFunction,
  type LoaderFunctionArgs,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router"
import { HoneypotProvider } from "remix-utils/honeypot/react"

import {
  AdministrationPanel,
  type AdministrationPanelUser,
} from "~/components/administration-panel"
import { AppBody } from "~/components/app-body"
import { AppFooter } from "~/components/app-footer"
import { AppHeader } from "~/components/app-header"
import { AppLayout } from "~/components/app-layout"
import { AuthenticityTokenProvider } from "~/components/authenticity-token-provider"
import { getAuthentication } from "~/utils/auth.server"
import { commitCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"
import { honeypot } from "~/utils/honeypot.server"
import "~/styles/global.css"
import "~/styles/fonts.css"
import "~/styles/sizes.css"
import "~/styles/colors.css"
import { preloadFonts } from "~/utils/preload-fonts"

import type { Route } from "./+types/root"

export const links: LinksFunction = () => [
  ...preloadFonts("regular", "text", "medium", "semiBold", "bold"),
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "alternate icon", href: "/favicon.ico" },
]

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const honeypotInputProps = honeypot.getInputProps()
  const [csrfToken, csrfCookieHeader] = await commitCSRF(request)

  const { isAuthenticated, sessionId } = await getAuthentication(request)

  let administrationPanelUser: AdministrationPanelUser = {
    name: undefined,
    email: undefined,
    image: {
      id: undefined,
      altText: undefined,
    },
  }

  if (sessionId !== undefined) {
    const session = await prisma.session.findUnique({
      where: {
        id: sessionId,
      },
      select: {
        id: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    administrationPanelUser = {
      name: session?.user.name ?? undefined,
      email: session?.user.email ?? undefined,
      image: {
        id: undefined,
        altText: undefined,
      },
    }
  }

  return data(
    {
      isAuthenticated,
      user: administrationPanelUser,
      honeypotInputProps,
      csrfToken,
    },
    {
      headers: {
        ...(csrfCookieHeader ? { "Set-Cookie": csrfCookieHeader } : {}),
      },
    }
  )
}

export default function App({ loaderData }: Route.ComponentProps) {
  const isAuthenticated = loaderData?.isAuthenticated ?? false
  const user = {
    name: loaderData?.user.name,
    email: loaderData?.user.email,
    image: {
      id: loaderData?.user.image.id,
      altText: loaderData?.user.image.altText,
    },
  }

  return (
    <html lang="cs-CZ">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <HoneypotProvider {...loaderData.honeypotInputProps}>
        <AuthenticityTokenProvider token={loaderData.csrfToken}>
          <AppLayout>
            <AppHeader isInEditMode={isAuthenticated}>
              {isAuthenticated ? <AdministrationPanel user={user} /> : null}
            </AppHeader>
            <AppBody>
              <Outlet />
            </AppBody>
            <AppFooter />
            <ScrollRestoration />
            <Scripts />
          </AppLayout>
        </AuthenticityTokenProvider>
      </HoneypotProvider>
    </html>
  )
}
