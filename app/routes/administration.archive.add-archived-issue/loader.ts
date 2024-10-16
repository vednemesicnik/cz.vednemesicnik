import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node"

import { getAuthorization } from "~/utils/auth.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  return json({ status: "success" } as const)
}
