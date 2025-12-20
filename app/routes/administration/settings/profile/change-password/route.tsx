// noinspection JSUnusedGlobalSymbols

import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
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

  const [form, fields] = useForm({
    id: "change-password",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.submissionResult,
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

  const isLoadingOrSubmitting = state !== "idle"
  const isSubmitting = state === "submitting"
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Změnit heslo</AdminHeadline>

      <Form method="post" {...getFormProps(form)}>
        <Fieldset legend={"Heslo"} disabled={isLoadingOrSubmitting}>
          <Input
            label="Nové heslo"
            {...getInputProps(fields.newPassword, { type: "password" })}
            autoComplete="new-password"
            errors={fields.newPassword.errors}
          />
          <Input
            label="Potvrzení nového hesla"
            {...getInputProps(fields.newPasswordConfirmation, {
              type: "password",
            })}
            autoComplete="new-password"
            errors={fields.newPasswordConfirmation.errors}
          />
        </Fieldset>

        <input {...getInputProps(fields.userId, { type: "hidden" })} />
        <AuthenticityTokenInput />

        <FormActions>
          <Button type="submit" disabled={!canSubmit} variant={"primary"}>
            {isSubmitting ? "Probíhá změna…" : "Změnit"}
          </Button>
          <AdminLinkButton to={"/administration/settings/profile"}>
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
