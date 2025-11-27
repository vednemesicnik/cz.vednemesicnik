// noinspection JSUnusedGlobalSymbols

import { Outlet } from "react-router"

import { AdministrationFooter } from "~/components/administration-footer"
import { AdministrationHeader } from "~/components/administration-header"
import { AdministrationPage } from "~/components/administration-page"
import { AdministrationSidebar } from "~/components/administration-sidebar"
import { AuthenticityTokenProvider } from "~/components/authenticity-token-provider"
import { UserMenu } from "~/components/user-menu"

import "~/styles/admin-tokens.css"

import type { Route } from "./+types/route"
import styles from "./_styles.module.css"

export { loader } from "./_loader"

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const user = {
    name: loaderData?.user.name,
    email: loaderData?.user.email ?? "",
  }

  const navigationItems = [
    { to: "/administration", label: "Přehled", visible: true, end: true },
    { to: "/administration/archive", label: "Archiv", visible: true },
    { to: "/administration/podcasts", label: "Podcasty", visible: true },
    { to: "/administration/users", label: "Uživatelé", visible: true },
    {
      to: "/administration/editorial-board",
      label: "Redakce",
      visible: true,
    },
    { to: "/administration/settings", label: "Nastavení", visible: true },
  ]

  return (
    <AuthenticityTokenProvider token={loaderData.csrfToken}>
      <div className={styles.layout}>
        <AdministrationHeader>
          <UserMenu userName={user.name} userEmail={user.email} />
        </AdministrationHeader>
        <AdministrationSidebar navigationItems={navigationItems} />
        <AdministrationPage>
          <Outlet />
        </AdministrationPage>
        <AdministrationFooter />
      </div>
    </AuthenticityTokenProvider>
  )
}
