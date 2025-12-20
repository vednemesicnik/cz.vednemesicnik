// noinspection JSUnusedGlobalSymbols

import { Outlet } from "react-router"
import { HoneypotProvider } from "remix-utils/honeypot/react"

import { AdminHeader } from "~/components/admin-header"
import { AdministrationContent } from "~/components/administration-content"
import { AdministrationFooter } from "~/components/administration-footer"

import type { Route } from "./+types/route"
import styles from "./_styles.module.css"

export { loader } from "./_loader"

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <HoneypotProvider {...loaderData.honeypotInputProps}>
      <div className={styles.layout}>
        <AdminHeader />
        <AdministrationContent className={styles.page}>
          <Outlet />
        </AdministrationContent>
        <AdministrationFooter />
      </div>
    </HoneypotProvider>
  )
}
