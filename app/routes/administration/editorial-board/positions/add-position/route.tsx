// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from "@conform-to/react"
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
import { Select } from "~/components/select"

import type { Route } from "./+types/route"
import { getSchema } from "./_schema"

export default function RouteComponent({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { state } = useNavigation()

  const [form, fields] = useForm({
    id: "add-position",
    constraint: getZodConstraint(
      getSchema(loaderData.editorialBoardPositionsCount)
    ),
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) =>
      parseWithZod(formData, {
        schema: getSchema(loaderData.editorialBoardPositionsCount),
      }),
    defaultValue: {
      key: "",
      pluralLabel: "",
      order: "",
      authorId: loaderData.selfAuthorId,
    },
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  const isLoadingOrSubmitting = state !== "idle"
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Přidat pozici</AdminHeadline>

      <Form method="post" {...getFormProps(form)}>
        <Fieldset legend={"Detaily pozice"} disabled={isLoadingOrSubmitting}>
          <Input
            label={"Unikátní klíč v angličtině"}
            {...getInputProps(fields.key, { type: "text" })}
            placeholder={"editor"}
            errors={fields.key.errors}
          />

          <Input
            label={"Označení v množném čísle"}
            {...getInputProps(fields.pluralLabel, { type: "text" })}
            placeholder={"redaktorky a redaktoři"}
            errors={fields.pluralLabel.errors}
          />

          <Input
            label={"Pořadí"}
            {...getInputProps(fields.order, { type: "number" })}
            placeholder={"2"}
            errors={fields.order.errors}
          />
        </Fieldset>

        <Fieldset legend={"Autor"} disabled={isLoadingOrSubmitting}>
          <Select
            label={"Autor"}
            {...getSelectProps(fields.authorId)}
            errors={fields.authorId.errors}
          >
            {loaderData.authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </Select>
        </Fieldset>

        <AuthenticityTokenInput />

        <FormActions>
          <Button type="submit" disabled={!canSubmit} variant={"primary"}>
            Přidat
          </Button>
          <AdminLinkButton to={"/administration/editorial-board/positions"}>
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}

export { handle } from "./_handle"
export { meta } from "./_meta"
export { loader } from "./_loader"
export { action } from "./_action"
