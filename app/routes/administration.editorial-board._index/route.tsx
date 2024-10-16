import { NavLink, Outlet } from "@remix-run/react"

export default function Route() {
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

export { meta } from "./meta"
export { loader } from "./loader"
