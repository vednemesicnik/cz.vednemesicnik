// noinspection JSUnusedGlobalSymbols

import { Outlet } from "react-router"

import { AdminHeader } from "~/components/admin-header"
import { AdminUserMenu } from "~/components/admin-user-menu"
import { AdministrationContent } from "~/components/administration-content"
import { AdministrationFooter } from "~/components/administration-footer"
import { AdministrationSidebar } from "~/components/administration-sidebar"
import { AuthenticityTokenProvider } from "~/components/authenticity-token-provider"

import "~/styles/admin-tokens.css"

import type { Route } from "./+types/route"
import styles from "./_styles.module.css"

export { loader } from "./_loader"

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const user = {
    name: loaderData?.user.name,
    email: loaderData?.user.email ?? "",
  }

  const { permissions } = loaderData

  const navigationItems = [
    { to: "/administration", label: "Přehled", visible: true, end: true },
    {
      to: "/administration/users",
      label: "Uživatelé",
      visible: permissions.canViewUsers,
    },
    {
      to: "/administration/authors",
      label: "Autoři",
      visible: permissions.canViewAuthors,
    },
    {
      to: "/administration/articles",
      label: "Články",
      visible: permissions.canViewArticles,
    },
    {
      to: "/administration/podcasts",
      label: "Podcasty",
      visible: permissions.canViewPodcasts,
    },
    {
      to: "/administration/archive",
      label: "Archiv",
      visible: permissions.canViewIssues,
    },
    {
      to: "/administration/editorial-board",
      label: "Redakce",
      visible: permissions.canViewEditorialBoard,
    },
    { to: "/administration/settings", label: "Nastavení", visible: true },
  ]

  return (
    <AuthenticityTokenProvider token={loaderData.csrfToken}>
      <div className={styles.layout}>
        <AdminHeader>
          <AdminUserMenu userName={user.name} userEmail={user.email} />
        </AdminHeader>
        <AdministrationSidebar navigationItems={navigationItems} />
        <AdministrationContent className={styles.page}>
          <Outlet />
        </AdministrationContent>
        <AdministrationFooter />
      </div>
    </AuthenticityTokenProvider>
  )
}
