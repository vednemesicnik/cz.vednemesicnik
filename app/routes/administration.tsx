// noinspection JSUnusedGlobalSymbols

import { json, type LoaderFunctionArgs, type MetaFunction, redirect } from "@remix-run/node"
import { NavLink, Outlet } from "@remix-run/react"

import { Headline } from "app/components/headline"
import { Page } from "~/components/page"
import { getAuthorization } from "~/utils/auth.server"

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
      <Headline>Administrace</Headline>
      <NavLink to={"/administration/archive"}>Archiv</NavLink>
      <NavLink to={"/administration/articles"}>Články</NavLink>
      <NavLink to={"/administration/podcast"}>Podcast</NavLink>
      <NavLink to={"/administration/editorial-board"}>Redakce</NavLink>
      <Outlet />
    </Page>
  )
}
