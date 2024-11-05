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
    return json(
      {
        submissionResult: submission.reply({
          hideFields: ["password"],
        }),
      },
      {
        status: submission.status === "error" ? 400 : 200,
      }
    )
  }

  const { email, password } = submission.value

  const user = await signIn({ email, password })

  if (user === null) {
    return json(
      {
        submissionResult: submission.reply({
          hideFields: ["password"],
          formErrors: ["E-mail nebo heslo je nesprávné."],
        }),
      },
      {
        status: 400,
      }
    )
  }

  return redirect("/administration", {
    headers: {
      "Set-Cookie": await createAuthSession(request, user.id),
    },
  })
}
