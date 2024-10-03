// noinspection HtmlRequiredTitleElement,JSUnusedGlobalSymbols

import { cssBundleHref } from "@remix-run/css-bundle"
import { json, type LinksFunction, type LoaderFunctionArgs } from "@remix-run/node"
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react"
import { AuthenticityTokenProvider } from "remix-utils/csrf/react"
import { HoneypotProvider } from "remix-utils/honeypot/react"

import { AdministrationPanel, type AdministrationPanelUser } from "~/components/administration-panel"
import { AppBody } from "~/components/app-body"
import { AppFooter } from "~/components/app-footer"
import { AppHeader } from "~/components/app-header"
import { AppLayout } from "~/components/app-layout"
import { getAuthorization } from "~/utils/auth.server"
import { csrf } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"
import { honeypot } from "~/utils/honeypot.server"

import "~/styles/global.module.css"
import "~/styles/fonts.module.css"
import "~/styles/sizes.module.css"
import "~/styles/colors.module.css"

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "alternate icon", href: "/favicon.ico" },
]

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const honeypotInputProps = honeypot.getInputProps()
  const [csrfToken, csrfCookieHeader] = await csrf.commitToken(request)

  const { isAuthorized, userId } = await getAuthorization(request)

  let administrationPanelUser: AdministrationPanelUser = {
    name: undefined,
    email: undefined,
    image: {
      id: undefined,
      altText: undefined,
    },
  }

  if (isAuthorized) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        email: true,
        image: {
          select: {
            id: true,
            altText: true,
          },
        },
      },
    })

    administrationPanelUser = {
      name: user?.name ?? undefined,
      email: user?.email ?? undefined,
      image: {
        id: user?.image?.id ?? undefined,
        altText: user?.image?.altText ?? undefined,
      },
    }
  }

  return json(
    {
      isAuthorized,
      user: administrationPanelUser,
      honeypotInputProps,
      csrfToken,
    },
    {
      headers: csrfCookieHeader ? { "Set-Cookie": csrfCookieHeader } : {},
    }
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>()

  const isAuthorized = data.isAuthorized
  const user = {
    name: data.user.name,
    email: data.user.email,
    image: {
      id: data.user.image.id,
      altText: data.user.image.altText,
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
      <HoneypotProvider {...data.honeypotInputProps}>
        <AuthenticityTokenProvider token={data.csrfToken}>
          <AppLayout>
            <AppHeader isInEditMode={isAuthorized}>
              {isAuthorized ? <AdministrationPanel user={user} /> : null}
            </AppHeader>
            <AppBody>{children}</AppBody>
            <AppFooter isInEditMode={isAuthorized} />
            <ScrollRestoration />
            <Scripts />
          </AppLayout>
        </AuthenticityTokenProvider>
      </HoneypotProvider>
    </html>
  )
}

export default function App() {
  return <Outlet />
}
