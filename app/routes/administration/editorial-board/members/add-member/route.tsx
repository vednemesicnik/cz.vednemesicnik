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
import { schema } from "./_schema"

export default function RouteComponent({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { state } = useNavigation()

  const [form, fields] = useForm({
    id: "add-member",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    defaultValue: {
      fullName: "",
      positionIds: [],
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
      <AdminHeadline>Přidat člena</AdminHeadline>

      <Form method="post" {...getFormProps(form)}>
        <Fieldset
          legend={"Informace o členovi"}
          disabled={isLoadingOrSubmitting}
        >
          <Input
            label={"Celé jméno"}
            {...getInputProps(fields.fullName, { type: "text" })}
            placeholder={"Jan Novák"}
            errors={fields.fullName.errors}
          />
        </Fieldset>

        <Fieldset legend={"Pozice"} disabled={isLoadingOrSubmitting}>
          <Select
            label={"Pozice"}
            {...getSelectProps(fields.positionIds)}
            multiple
            errors={fields.positionIds.errors}
          >
            {loaderData.editorialBoardMemberPositions.map((position) => (
              <option key={position.id} value={position.id}>
                {position.key}
              </option>
            ))}
          </Select>
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
          <AdminLinkButton to={"/administration/editorial-board/members"}>
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
