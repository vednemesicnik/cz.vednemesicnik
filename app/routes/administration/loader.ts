import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node"

import { getAuthorization } from "~/utils/auth.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)
  const url = new URL(request.url)

  if (!isAuthorized && url.pathname === "/administration") {
    throw redirect("/administration/sign-in")
  }

  return json({ status: "success" })
}
