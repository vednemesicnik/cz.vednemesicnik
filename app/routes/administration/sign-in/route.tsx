// noinspection JSUnusedGlobalSymbols

import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { useEffect, useRef } from "react"
import { HoneypotInputs } from "remix-utils/honeypot/react"

import { Button } from "~/components/button"
import { Form } from "~/components/form"
import { Input } from "~/components/input"
import { useHydrated } from "~/utils/use-hydrated"

import type { Route } from "./+types/route"
import { schema } from "./_schema"
import styles from "./_styles.module.css"

export { meta } from "./_meta"
export { loader } from "./_loader"
export { action } from "./_action"

export default function Route({ actionData }: Route.ComponentProps) {
  const isHydrated = useHydrated()
  const passwordInputRef = useRef<HTMLInputElement>(null)

  const [form, fields] = useForm({
    id: "password-sign-in",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.submissionResult,
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
    <div className={styles.container}>
      <section className={styles.card}>
        <h1 className={styles.title}>Přihlášení</h1>
        <p className={styles.subtitle}>
          Zadejte své přihlašovací údaje pro přístup do administrace
        </p>

        <Form
          {...getFormProps(form)}
          method={"post"}
          errors={form.errors}
          className={styles.form}
        >
          <HoneypotInputs />

          <Input
            label={"E-mail"}
            errors={fields.email.errors}
            {...getInputProps(fields.email, { type: "email" })}
            placeholder={"vas-email@example.com"}
          />

          <Input
            ref={passwordInputRef}
            label={"Heslo"}
            errors={fields.password.errors}
            {...getInputProps(fields.password, { type: "password" })}
            placeholder={"••••••••"}
          />

          <Button type="submit" className={styles.button}>
            Přihlásit se
          </Button>
        </Form>
      </section>
    </div>
  )
}
