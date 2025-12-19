// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { useState } from "react"
import { useNavigation } from "react-router"

import { AdminHeadline } from "~/components/admin-headline"
import { AdminLinkButton } from "~/components/admin-link-button"
import { AdminPage } from "~/components/admin-page"
import { AuthenticityTokenInput } from "~/components/authenticity-token-input"
import { Button } from "~/components/button"
import { Fieldset } from "~/components/fieldset"
import { Form } from "~/components/form"
import { FormActions } from "~/components/form-actions"
import { Input } from "~/components/input"
import { Radio } from "~/components/radio"
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
}: Route.ComponentProps) {
  const { state } = useNavigation()
  const [authorMode, setAuthorMode] = useState<"new" | "existing">("new")

  const [form, fields] = useForm({
    id: "add-user",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    defaultValue: {
      authorMode: "new",
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  const isLoadingOrSubmitting = state !== "idle"
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Přidat uživatele</AdminHeadline>

      <Form method="post" {...getFormProps(form)}>
        <Fieldset legend={"Detaily uživatele"} disabled={isLoadingOrSubmitting}>
          <Input
            label="E-mail"
            {...getInputProps(fields.email, { type: "email" })}
            placeholder="user@domain.name"
            errors={fields.email.errors}
          />
          <Input
            label="Jméno a příjmení"
            {...getInputProps(fields.name, { type: "text" })}
            placeholder="Jan Novák"
            errors={fields.name.errors}
          />
        </Fieldset>

        <Fieldset legend={"Heslo"} disabled={isLoadingOrSubmitting}>
          <Input
            label="Heslo"
            {...getInputProps(fields.password, { type: "password" })}
            errors={fields.password.errors}
          />
          <Input
            label="Potvrzení hesla"
            {...getInputProps(fields.passwordConfirmation, {
              type: "password",
            })}
            errors={fields.passwordConfirmation.errors}
          />
        </Fieldset>

        <Fieldset legend={"Profil autora"} disabled={isLoadingOrSubmitting}>
          <Radio
            label="Vytvořit nový profil autora"
            {...getInputProps(fields.authorMode, {
              type: "radio",
              value: "new",
            })}
            errors={fields.authorMode.errors}
            onChange={(e) =>
              setAuthorMode(e.currentTarget.value as "new" | "existing")
            }
          />
          <Radio
            label="Připojit k existujícímu autorovi"
            {...getInputProps(fields.authorMode, {
              type: "radio",
              value: "existing",
            })}
            errors={fields.authorMode.errors}
            onChange={(e) =>
              setAuthorMode(e.currentTarget.value as "new" | "existing")
            }
          />

          {authorMode === "existing" && (
            <Select
              label="Vyberte autora"
              {...getSelectProps(fields.existingAuthorId)}
              errors={fields.existingAuthorId.errors}
            >
              <option value="">Vyberte autora</option>
              {loaderData.authorsWithoutUser.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name} ({author.role.name})
                </option>
              ))}
            </Select>
          )}
        </Fieldset>

        <Fieldset legend={"Oprávnění"} disabled={isLoadingOrSubmitting}>
          <Select
            label="Role"
            {...getSelectProps(fields.roleId)}
            errors={fields.roleId.errors}
          >
            <option value="">Vyberte roli</option>
            {loaderData.roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </Select>
        </Fieldset>

        <AuthenticityTokenInput />

        <FormActions>
          <Button type="submit" disabled={!canSubmit} variant={"primary"}>
            Přidat
          </Button>
          <AdminLinkButton to={"/administration/users"}>Zrušit</AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
