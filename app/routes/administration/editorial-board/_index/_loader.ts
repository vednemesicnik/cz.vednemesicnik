import { type LoaderFunctionArgs } from "react-router"

import { requireAuthentication } from "~/utils/auth.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAuthentication(request)

  return { status: "success" }
}
