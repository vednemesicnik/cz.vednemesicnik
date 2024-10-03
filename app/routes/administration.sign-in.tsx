// noinspection JSUnusedGlobalSymbols

import { type ActionFunctionArgs, json, type LoaderFunctionArgs, type MetaFunction, redirect } from "@remix-run/node"
import { Form, useActionData } from "@remix-run/react"
import { HoneypotInputs } from "remix-utils/honeypot/react"

import { Button } from "~/components/button"
import { Page } from "~/components/page"
import { createAuthSession, getAuthorization, signIn } from "~/utils/auth.server"
import { checkHoneypot } from "~/utils/honeypot.server"
import { useHydrated } from "~/utils/use-hydrated"

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Administrace - přihlášení" }]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (isAuthorized) {
    throw redirect("/administration")
  }

  return json({ status: "OK" })
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()

  checkHoneypot(formData)

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // TODO: Validate e-mail and password

  const user = await signIn(email, password)

  if (user === null) {
    return json({ errors: { signIn: "E-mail nebo heslo je nesprávné." } })
  }

  return redirect("/administration", {
    headers: {
      "Set-Cookie": await createAuthSession(request, user.id),
    },
  })
}

export default function AdministrationSignIn() {
  const { isHydrated } = useHydrated()
  const actionData = useActionData<typeof action>()

  return (
    <Page>
      <h1>Administrace - přihlášení</h1>

      <Form method={"post"} noValidate={isHydrated}>
        {actionData?.errors?.signIn ? <p>{actionData.errors.signIn}</p> : null}

        <HoneypotInputs />

        <label htmlFor="email">E-mail</label>
        <input type="email" name="email" id="email" />

        <label htmlFor="password">Heslo</label>
        <input type="password" name="password" id="password" />

        <Button type="submit">Přihlásit</Button>
      </Form>
    </Page>
  )
}
