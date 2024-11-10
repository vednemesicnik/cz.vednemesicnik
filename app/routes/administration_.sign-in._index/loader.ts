import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { requireUnauthenticated } from "~/utils/auth.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUnauthenticated(request)

  return json({ status: "success" })
}
