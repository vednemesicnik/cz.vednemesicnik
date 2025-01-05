// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"

import { AuthenticityTokenInput } from "~/components/authenticity-token-input"
import { Fieldset } from "~/components/fieldset"
import { Form } from "~/components/form"
import { Headline } from "~/components/headline"
import { Input } from "~/components/input"
import { Select } from "~/components/select"

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
    defaultValue: {
      email: loaderData.user.email,
      name: loaderData.user.name,
      roleId: loaderData.user.role.id,
      userId: loaderData.user.id,
    },
  })

  return (
    <>
      <Headline>Upravit uživatele</Headline>

      <Form method={"post"} {...getFormProps(form)} errors={form.errors}>
        <Fieldset legend={"Detaily uživatele"}>
          <Input
            label={"E-mail"}
            {...getInputProps(fields.email, { type: "email" })}
            placeholder={"user@domain.name"}
            errors={fields.email.errors}
          />
          <Input
            label={"Jméno a příjmení"}
            {...getInputProps(fields.name, { type: "text" })}
            placeholder={"John Doe"}
            errors={fields.name.errors}
          />
        </Fieldset>
        <Fieldset legend={"Heslo"}>
          <Input
            {...getInputProps(fields.password, { type: "password" })}
            label={"Heslo"}
            errors={fields.password.errors}
          />
          <Input
            {...getInputProps(fields.passwordConfirmation, {
              type: "password",
            })}
            label={"Potvrzení hesla"}
            errors={fields.passwordConfirmation.errors}
          />
        </Fieldset>
        {loaderData.roles.length > 0 ? (
          <Fieldset legend={"Oprávnění"}>
            <Select
              label={"Role"}
              {...getSelectProps(fields.roleId)}
              errors={fields.roleId.errors}
            >
              {loaderData.roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </Fieldset>
        ) : (
          <input {...getInputProps(fields.roleId, { type: "hidden" })} />
        )}
        <input {...getInputProps(fields.userId, { type: "hidden" })} />
        <AuthenticityTokenInput />
        <br />
        <button type="submit">Upravit uživatele</button>
      </Form>
    </>
  )
}

export { handle } from "./_handle"
export { action } from "./_action"
export { loader } from "./_loader"
