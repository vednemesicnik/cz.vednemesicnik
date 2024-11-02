import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node"

import { getAuthorization } from "~/utils/auth.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)
  const url = new URL(request.url)

  if (
    !isAuthorized &&
    (url.pathname.endsWith("/administration") ||
      url.pathname.endsWith("/administration/"))
  ) {
    throw redirect("/administration/sign-in")
  }

  return json({ status: "success" })
}
