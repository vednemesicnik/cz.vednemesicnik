import { Outlet } from "@remix-run/react"

export default function Route() {
  return <Outlet />
}

export { handle } from "./_handle"
export { loader } from "./_loader"
