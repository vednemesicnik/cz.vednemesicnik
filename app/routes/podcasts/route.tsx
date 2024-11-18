import { Outlet } from "@remix-run/react"

import { Breadcrumbs } from "~/components/breadcrumbs"
import { Page } from "~/components/page"

export default function Route() {
  return (
    <Page>
      <Breadcrumbs />
      <Outlet />
    </Page>
  )
}

export { handle } from "./_handle"
