import { Link, Outlet } from "react-router";

export default function Route() {
  return (
    <>
      <h3>Redakce</h3>
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

export { meta } from "./_meta"
export { loader } from "./_loader"
