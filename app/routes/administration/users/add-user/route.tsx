// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import { Form } from "react-router"

import { AuthenticityTokenInput } from "~/components/authenticity-token-input"
import { Headline } from "~/components/headline"

import type { Route } from "./+types/route"
import { schema } from "./_schema"

export default function Route({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [form, fields] = useForm({
    id: "add-user",
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  return (
    <>
      <Headline>Přidat uživatele</Headline>

      <Form method={"post"} {...getFormProps(form)}>
        {form.errors?.map((error) => (
          <output key={error} style={{ color: "red" }}>
            {error}
          </output>
        ))}
        <fieldset>
          <legend>Detaily uživatele</legend>
          <label htmlFor={fields.email.id}>E-mail</label>
          <input
            {...getInputProps(fields.email, { type: "email" })}
            placeholder={"user@domain.name"}
          />
          {fields.email.errors?.map((error) => (
            <output key={error} style={{ color: "red" }}>
              {error}
            </output>
          ))}
          <br />
          <label htmlFor={fields.name.id}>Jméno a příjmení</label>
          <input
            {...getInputProps(fields.name, { type: "text" })}
            placeholder={"John Doe"}
          />
          {fields.name.errors?.map((error) => (
            <output key={error} style={{ color: "red" }}>
              {error}
            </output>
          ))}
        </fieldset>
        <fieldset>
          <legend>Heslo</legend>
          <label htmlFor={fields.password.id}>Heslo</label>
          <input {...getInputProps(fields.password, { type: "password" })} />
          {fields.password.errors?.map((error) => (
            <output key={error} style={{ color: "red" }}>
              {error}
            </output>
          ))}
          <br />
          <label htmlFor={fields.passwordConfirmation.id}>
            Potvrzení hesla
          </label>
          <input
            {...getInputProps(fields.passwordConfirmation, {
              type: "password",
            })}
          />
          {fields.passwordConfirmation.errors?.map((error) => (
            <output key={error} style={{ color: "red" }}>
              {error}
            </output>
          ))}
        </fieldset>
        <fieldset>
          <legend>Oprávnění</legend>
          <label htmlFor={fields.roleId.id}>Role</label>
          <select {...getSelectProps(fields.roleId)}>
            {loaderData.roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          {fields.roleId.errors?.map((error) => (
            <output key={error} style={{ color: "red" }}>
              {error}
            </output>
          ))}
        </fieldset>
        <AuthenticityTokenInput />
        <br />
        <button type="submit">Přidat uživatele</button>
      </Form>
    </>
  )
}

export { handle } from "./_handle"
export { action } from "./_action"
export { loader } from "./_loader"
