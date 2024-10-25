import { NavLink, Outlet } from "@remix-run/react"

import { Headline } from "app/components/headline"
import { Page } from "~/components/page"

export default function Route() {
  return (
    <Page>
      <Headline>Administrace</Headline>
      <NavLink to={"/administration/archive"} preventScrollReset={true}>
        Archiv
      </NavLink>
      <NavLink to={"/administration/podcasts"} preventScrollReset={true}>
        Podcasty
      </NavLink>
      <NavLink to={"/administration/editorial-board"} preventScrollReset={true}>
        Redakce
      </NavLink>
      <hr />
      <Outlet />
    </Page>
  )
}

export { meta } from "./meta"
export { loader } from "./loader"
