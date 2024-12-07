import { type LoaderFunctionArgs } from "react-router";

import { requireUnauthenticated } from "~/utils/auth.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUnauthenticated(request)

  return { status: "success" }
}
