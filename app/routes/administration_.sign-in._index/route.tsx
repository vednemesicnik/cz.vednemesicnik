import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { Form, useActionData } from "@remix-run/react"
import { useEffect, useRef } from "react"
import { HoneypotInputs } from "remix-utils/honeypot/react"

import { Button } from "~/components/button"
import { Headline } from "~/components/headline"
import { Page } from "~/components/page"
import { useHydrated } from "~/utils/use-hydrated"

import { type action } from "./action"
import { schema } from "./schema"

export default function Route() {
  const { isHydrated } = useHydrated()
  const actionData = useActionData<typeof action>()

  const passwordInputRef = useRef<HTMLInputElement>(null)

  const [form, fields] = useForm({
    id: "add-podcast",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.submissionResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    defaultNoValidate: isHydrated,
  })

  useEffect(() => {
    const passwordInput = passwordInputRef.current
    if (passwordInput === null) return

    if (
      (form.errors && form.errors.length > 0) ||
      (fields.password.errors && fields.password.errors.length > 0)
    ) {
      passwordInput.value = ""
    }
  }, [fields.password.errors, form.errors])

  return (
    <Page>
      <Headline>Administrace - přihlášení</Headline>

      <Form {...getFormProps(form)} method={"post"}>
        {form.errors?.map((error) => {
          return (
            <output key={error} style={{ color: "red" }}>
              {error}
            </output>
          )
        })}

        <HoneypotInputs />

        <fieldset>
          <legend>Přihlašovací údaje</legend>
          <label htmlFor={fields.email.id}>E-mail</label>
          <input
            {...getInputProps(fields.email, { type: "email" })}
            key={fields.email.key}
            defaultValue={fields.email.initialValue ?? fields.email.value ?? ""}
            placeholder={"example@local.dev"}
          />
          {fields.email.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
          <br />
          <label htmlFor={fields.password.id}>Heslo</label>
          <input
            ref={passwordInputRef}
            {...getInputProps(fields.password, { type: "password" })}
            key={fields.password.key}
            defaultValue={
              fields.password.initialValue ?? fields.password.value ?? ""
            }
          />
          {fields.password.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
        </fieldset>

        <Button type="submit">Přihlásit</Button>
      </Form>
    </Page>
  )
}

export { meta } from "./meta"
export { loader } from "./loader"
export { action } from "./action"
