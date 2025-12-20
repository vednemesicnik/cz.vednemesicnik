// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  getTextareaProps,
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
import { TextArea } from "~/components/text-area"
import { getAuthorRoleLabel } from "~/utils/role-labels"

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
  const { authorId } = params
  const { state } = useNavigation()

  const [form, fields] = useForm({
    id: "edit-author",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    defaultValue: {
      name: loaderData.author.name,
      bio: loaderData.author.bio ?? "",
      roleId: loaderData.author.role.id,
      authorId: loaderData.author.id,
    },
  })

  const isLoadingOrSubmitting = state !== "idle"
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Upravit autora</AdminHeadline>

      <Form method="post" {...getFormProps(form)}>
        <Fieldset legend={"Detaily autora"} disabled={isLoadingOrSubmitting}>
          <Input
            label="Jméno"
            {...getInputProps(fields.name, { type: "text" })}
            placeholder="Jan Novák"
            errors={fields.name.errors}
          />
          <TextArea
            label="Bio"
            {...getTextareaProps(fields.bio)}
            placeholder="Krátký popis autora..."
            errors={fields.bio.errors}
          />
        </Fieldset>

        {loaderData.roles.length > 0 ? (
          <Fieldset legend={"Oprávnění"} disabled={isLoadingOrSubmitting}>
            <Select
              label="Role"
              {...getSelectProps(fields.roleId)}
              errors={fields.roleId.errors}
            >
              {loaderData.roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {getAuthorRoleLabel(role.name)}
                </option>
              ))}
            </Select>
          </Fieldset>
        ) : (
          <input {...getInputProps(fields.roleId, { type: "hidden" })} />
        )}

        <input {...getInputProps(fields.authorId, { type: "hidden" })} />
        <AuthenticityTokenInput />

        <FormActions>
          <Button type="submit" disabled={!canSubmit} variant={"primary"}>
            Uložit
          </Button>
          <AdminLinkButton
            to={href("/administration/authors/:authorId", { authorId })}
          >
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
