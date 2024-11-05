import { Link, Outlet } from "@remix-run/react"

export default function Route() {
  return (
    <>
      <h1>Administrace Redakce</h1>
      <Link
        to={"/administration/editorial-board/positions"}
        preventScrollReset={true}
      >
        Pozice
      </Link>
      <Link
        to={"/administration/editorial-board/members"}
        preventScrollReset={true}
      >
        Členové
      </Link>
      <hr />
      <Outlet />
    </>
  )
}

export { meta } from "./meta"
export { loader } from "./loader"
