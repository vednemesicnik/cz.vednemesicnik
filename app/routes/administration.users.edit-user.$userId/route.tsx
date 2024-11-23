import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import { Form, useLoaderData } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { getRights } from "~/utils/permissions"

import { type loader } from "./_loader"
import { schema } from "./_schema"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()

  const { user, session } = loaderData

  const [hasUpdateRight] = getRights(session.user.role.permissions, {
    actions: ["update"],
    access: ["own", "any"],
    ownId: session.user.id,
    targetId: user.id,
  })

  const [form, fields] = useForm({
    id: "add-user",
    lastResult: null,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    defaultValue: {
      email: loaderData.user.email,
      username: loaderData.user.username,
      name: loaderData.user.name,
      roleId: loaderData.user.role.id,
      userId: loaderData.user.id,
    },
  })

  return (
    <>
      <h3>Upravit uživatele</h3>

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
          <label htmlFor={fields.username.id}>Uživatelské jméno</label>
          <input
            {...getInputProps(fields.username, { type: "text" })}
            placeholder={"user"}
          />
          {fields.username.errors?.map((error) => (
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
        {user.role.name !== "owner" && (
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
        )}
        {user.role.name === "owner" && (
          <input {...getInputProps(fields.roleId, { type: "hidden" })} />
        )}
        <input {...getInputProps(fields.userId, { type: "hidden" })} />
        <AuthenticityTokenInput />
        <br />
        <button type="submit" disabled={!hasUpdateRight}>
          Upravit uživatele
        </button>
      </Form>
    </>
  )
}

export { action } from "./_action"
export { loader } from "./_loader"
