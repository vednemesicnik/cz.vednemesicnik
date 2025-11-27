// noinspection JSUnusedGlobalSymbols

import { Outlet } from "react-router"
import { HoneypotProvider } from "remix-utils/honeypot/react"

import { AdminHeader } from "~/components/admin-header"
import { AdministrationFooter } from "~/components/administration-footer"
import { AdministrationPage } from "~/components/administration-page"

import "~/styles/admin-tokens.css"
import type { Route } from "./+types/route"
import styles from "./_styles.module.css"

export { loader } from "./_loader"

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <HoneypotProvider {...loaderData.honeypotInputProps}>
      <div className={styles.layout}>
        <AdminHeader />
        <AdministrationPage>
          <Outlet />
        </AdministrationPage>
        <AdministrationFooter />
      </div>
    </HoneypotProvider>
  )
}
