import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
} from "@remix-run/node"
import { NavLink, Outlet } from "@remix-run/react"

import { getAuthorization } from "~/utils/auth.server"

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Administrace Redakce" }]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  return json({ status: "OK" })
}

export default function AdministrationEditorialBoard() {
  return (
    <>
      <h1>Administrace Redakce</h1>
      <NavLink
        to={"/administration/editorial-board/positions"}
        preventScrollReset={true}
      >
        Pozice
      </NavLink>
      <NavLink
        to={"/administration/editorial-board/members"}
        preventScrollReset={true}
      >
        Členové
      </NavLink>
      <hr />
      <Outlet />
    </>
  )
}
