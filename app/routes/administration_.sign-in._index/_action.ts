import { parseWithZod } from "@conform-to/zod"
import { type ActionFunctionArgs, json, redirect } from "@remix-run/node"
import bcrypt from "bcryptjs"

import { schema } from "~/routes/administration_.sign-in._index/components/password-form"
import {
  getSessionAuthCookieSessionExpirationDate,
  setSessionAuthCookieSession,
} from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import { checkHoneypot } from "~/utils/honeypot.server"

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
        registrationOptions: null,
        authenticationOptions: null,
        isAuthenticated: false,
      },
      {
        status: submission.status === "error" ? 400 : 200,
      }
    )
  }

  const { email, password } = submission.value

  let user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      password: { select: { hash: true } },
    },
  })

  if (user !== null && user.password !== null) {
    const isValid = await bcrypt.compare(password, user.password.hash)

    user = isValid ? user : null
  }

  if (user === null) {
    return json(
      {
        submissionResult: submission.reply({
          hideFields: ["password"],
          formErrors: ["E-mail nebo heslo je nesprávné."],
        }),
        registrationOptions: null,
        authenticationOptions: null,
        isAuthenticated: false,
      },
      {
        status: 400,
      }
    )
  }

  const session = await prisma.session.create({
    data: {
      user: { connect: { id: user.id } },
      expirationDate: getSessionAuthCookieSessionExpirationDate(),
    },
    select: { id: true, expirationDate: true },
  })

  return redirect("/administration", {
    headers: {
      "Set-Cookie": await setSessionAuthCookieSession(
        request,
        session.id,
        session.expirationDate
      ),
    },
  })
}
