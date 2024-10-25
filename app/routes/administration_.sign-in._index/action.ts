import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, json, redirect } from "@remix-run/node"

import { createAuthSession } from "~/utils/auth.server"
import { checkHoneypot } from "~/utils/honeypot.server"

import { schema } from "./schema"
import { signIn } from "./utils/sign-in.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()

  checkHoneypot(formData)

  const submission = await parseWithZod(formData, {
    schema,
    async: true,
  })

  if (submission.status !== "success") {
    return json({ lastResult: submission.reply() })
  }

  const { email, password } = submission.value

  const user = await signIn({ email, password })

  if (user === null) {
    return json({
      lastResult: submission.reply({
        formErrors: ["E-mail nebo heslo je nesprávné."],
      }),
    })
  }

  return redirect("/administration", {
    headers: {
      "Set-Cookie": await createAuthSession(request, user.id),
    },
  })
}
