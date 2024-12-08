import { Link, Outlet } from "react-router"

import { Headline } from "~/components/headline"

export default function Route() {
  return (
    <>
      <Headline>Redakce</Headline>
      <Link
        to={"/administration/editorial-board/members"}
        preventScrollReset={true}
      >
        Členové
      </Link>
      <Link
        to={"/administration/editorial-board/positions"}
        preventScrollReset={true}
      >
        Pozice
      </Link>
      <hr />
      <Outlet />
    </>
  )
}

export { meta } from "./_meta"
export { loader } from "./_loader"
