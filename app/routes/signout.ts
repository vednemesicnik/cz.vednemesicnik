// noinspection JSUnusedGlobalSymbols

import { type ActionFunctionArgs, redirect } from "@remix-run/node"

import { deleteAuthSession, getAuthSession } from "~/utils/auth.server"
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
