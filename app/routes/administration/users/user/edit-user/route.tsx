// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { href, useNavigation } from "react-router"

import { AdminHeadline } from "~/components/admin-headline"
import { AdminLinkButton } from "~/components/admin-link-button"
import { AdminPage } from "~/components/admin-page"
import { AuthenticityTokenInput } from "~/components/authenticity-token-input"
import { Button } from "~/components/button"
import { Fieldset } from "~/components/fieldset"
import { Form } from "~/components/form"
import { FormActions } from "~/components/form-actions"
import { Input } from "~/components/input"
import { Select } from "~/components/select"

import type { Route } from "./+types/route"
import { schema } from "./_schema"

export { action } from "./_action"
export { handle } from "./_handle"
export { loader } from "./_loader"
export { meta } from "./_meta"

export default function RouteComponent({
  loaderData,
  actionData,
  params,
}: Route.ComponentProps) {
  const { userId } = params
  const { state } = useNavigation()

  const [form, fields] = useForm({
    id: "edit-user",
    constraint: getZodConstraint(schema),
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

  const isLoadingOrSubmitting = state !== "idle"
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Upravit uživatele</AdminHeadline>

      <Form method="post" {...getFormProps(form)}>
        <Fieldset legend={"Detaily uživatele"} disabled={isLoadingOrSubmitting}>
          <Input
            label={"E-mail"}
            {...getInputProps(fields.email, { type: "email" })}
            placeholder={"user@domain.name"}
            errors={fields.email.errors}
          />
          <Input
            label={"Jméno a příjmení"}
            {...getInputProps(fields.name, { type: "text" })}
            placeholder={"Jan Novák"}
            errors={fields.name.errors}
          />
        </Fieldset>

        <Fieldset legend={"Heslo"} disabled={isLoadingOrSubmitting}>
          <Input
            label={"Heslo"}
            {...getInputProps(fields.password, { type: "password" })}
            errors={fields.password.errors}
          />
          <Input
            label={"Potvrzení hesla"}
            {...getInputProps(fields.passwordConfirmation, {
              type: "password",
            })}
            errors={fields.passwordConfirmation.errors}
          />
        </Fieldset>

        {loaderData.roles.length > 0 ? (
          <Fieldset legend={"Oprávnění"} disabled={isLoadingOrSubmitting}>
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

        <FormActions>
          <Button type="submit" disabled={!canSubmit} variant={"primary"}>
            Uložit
          </Button>
          <AdminLinkButton
            to={href("/administration/users/:userId", { userId })}
          >
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
