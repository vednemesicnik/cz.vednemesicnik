import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { useFetcher } from "@remix-run/react"
import { useEffect, useRef } from "react"
import { HoneypotInputs } from "remix-utils/honeypot/react"

import { Button } from "~/components/button"
import { type action } from "~/routes/administration_.sign-in._index/_action"
import { useHydrated } from "~/utils/use-hydrated"

import { schema } from "./_schema"

export const PasswordForm = () => {
  const { isHydrated } = useHydrated()
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const { Form, data } = useFetcher<typeof action>()

  const [form, fields] = useForm({
    id: "password-sign-in",
    constraint: getZodConstraint(schema),
    lastResult: data?.submissionResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    defaultNoValidate: isHydrated,
  })

  const formErrorsCount = form.errors?.length ?? 0
  const passwordErrorsCount = fields.password.errors?.length ?? 0

  useEffect(() => {
    const passwordInput = passwordInputRef.current
    if (passwordInput === null) return

    if (formErrorsCount > 0 || passwordErrorsCount > 0) {
      passwordInput.value = ""
    }
  }, [formErrorsCount, passwordErrorsCount])

  return (
    <>
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
    </>
  )
}
