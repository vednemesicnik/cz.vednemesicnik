// noinspection JSUnusedGlobalSymbols

import type { ActionFunctionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { getAuthSession, deleteAuthSession } from "~/utils/auth.server"
import { redirectBack } from "~/utils/redirect-back"

export const loader = () => {
  return redirect("/")
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const authSession = await getAuthSession(request)

  return redirectBack(request, {
    headers: {
      "Set-Cookie": await deleteAuthSession(authSession),
    },
  })
}
