// noinspection JSUnusedGlobalSymbols

import { Page } from "~/components/page"
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { redirect, json } from "@remix-run/node"
import { getAuthorization } from "~/utils/auth.server"
import { NavLink, Outlet } from "@remix-run/react"
import { PageHeading } from "~/components/page-heading"

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Administrace" }]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)
  const url = new URL(request.url)

  if (!isAuthorized && url.pathname === "/administration") {
    throw redirect("/administration/sign-in")
  }

  return json({ status: "OK" })
}

export default function Administration() {
  return (
    <Page>
      <PageHeading>Administrace</PageHeading>
      <NavLink to={"/administration/archive"}>Archiv</NavLink>
      <NavLink to={"/administration/articles"}>Články</NavLink>
      <NavLink to={"/administration/podcast"}>Podcast</NavLink>
      <NavLink to={"/administration/editorial-board"}>Redakce</NavLink>
      <Outlet />
    </Page>
  )
}
