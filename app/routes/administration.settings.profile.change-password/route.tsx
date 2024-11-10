import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { Form, useActionData, useLoaderData } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { type action } from "./_action"
import { type loader } from "./_loader"
import { schema } from "./_schema"

export default function Route() {
  const actionData = useActionData<typeof action>()
  const loaderData = useLoaderData<typeof loader>()

  const [form, fields] = useForm({
    id: "add-member",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.lastResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    defaultValue: {
      userId: loaderData.userId,
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  return (
    <>
      <h3>Změnit heslo</h3>

      <Form {...getFormProps(form)} method="post">
        <input {...getInputProps(fields.userId, { type: "hidden" })} />
        <label htmlFor={fields.newPassword.id}>Nové heslo</label>
        <input
          {...getInputProps(fields.newPassword, { type: "password" })}
          autoComplete={"new-password"}
        />
        {fields.newPassword.errors?.map((error) => {
          return (
            <output key={error} style={{ color: "red" }}>
              {error}
            </output>
          )
        })}
        <br />
        <label htmlFor={fields.newPasswordConfirmation.id}>
          Potvrzení nového hesla
        </label>
        <input
          {...getInputProps(fields.newPasswordConfirmation, {
            type: "password",
          })}
          autoComplete={"new-password"}
        />
        {fields.newPasswordConfirmation.errors?.map((error) => {
          return (
            <output key={error} style={{ color: "red" }}>
              {error}
            </output>
          )
        })}
        <AuthenticityTokenInput />
        <br />
        <button type="submit">Změnit heslo</button>
      </Form>
    </>
  )
}

export { action } from "./_action"
export { loader } from "./_loader"
export { meta } from "./_meta"
