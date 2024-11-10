import type { ActionFunctionArgs } from "@remix-run/node"

import {
  deleteAuthSession,
  getAuthSession,
  getSessionId,
} from "~/utils/auth.server"
import { redirectBack } from "~/utils/redirect-back"

import { deleteSession } from "./utils/delete-session.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const authSession = await getAuthSession(request)
  const sessionId = getSessionId(authSession)

  deleteSession(sessionId)

  return redirectBack(request, {
    headers: {
      "Set-Cookie": await deleteAuthSession(authSession),
    },
  })
}
