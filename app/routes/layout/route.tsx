// noinspection JSUnusedGlobalSymbols

import { Outlet } from "react-router"
import { HoneypotProvider } from "remix-utils/honeypot/react"

import { AdministrationPanel } from "~/components/administration-panel"
import { AppBody } from "~/components/app-body"
import { AppFooter } from "~/components/app-footer"
import { AppHeader } from "~/components/app-header"
import { AuthenticityTokenProvider } from "~/components/authenticity-token-provider"
import "./_styles.css"

import type { Route } from "./+types/route"

export { loader } from "./_loader"

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
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
    <>
      <HoneypotProvider {...loaderData.honeypotInputProps}>
        <AuthenticityTokenProvider token={loaderData.csrfToken}>
          <AppHeader isInEditMode={isAuthenticated}>
            {isAuthenticated ? <AdministrationPanel user={user} /> : null}
          </AppHeader>
          <AppBody>
            <Outlet />
          </AppBody>
          <AppFooter />
        </AuthenticityTokenProvider>
      </HoneypotProvider>
    </>
  )
}
