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
import { AdministrationPage } from "~/components/administration-page"
import { AuthenticityTokenInput } from "~/components/authenticity-token-input"
import { Button } from "~/components/button"
import { Fieldset } from "~/components/fieldset"
import { FileInput } from "~/components/file-input"
import { Form } from "~/components/form"
import { FormActions } from "~/components/form-actions"
import { Input } from "~/components/input"
import { Select } from "~/components/select"
import { getFormattedDateString } from "~/utils/get-formatted-date-string"
import { getIssueOrdinalNumber } from "~/utils/get-issue-ordinal-number"

import type { Route } from "./+types/route"
import { schema } from "./_schema"

export default function Route({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { issue } = loaderData
  const { state } = useNavigation()

  const [form, fields] = useForm({
    id: "edit-archived-issue-form",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    defaultValue: {
      id: issue.id,
      ordinalNumber: getIssueOrdinalNumber(issue.label),
      releasedAt: getFormattedDateString(issue.releasedAt),
      coverId: issue.cover?.id,
      pdfId: issue.pdf?.id,
      authorId: issue.author.id,
    },
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  const handleFileChange = (name: string, dirty: boolean) => () => {
    if (dirty) {
      form.validate({ name })
    }
  }

  const isLoadingOrSubmitting = state !== "idle"
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdministrationPage>
      <AdminHeadline>Upravit číslo ({issue.label})</AdminHeadline>
      <Form
        {...getFormProps(form)}
        method={"post"}
        encType={"multipart/form-data"}
        errors={form.errors}
      >
        <input {...getInputProps(fields.id, { type: "hidden" })} />

        <Fieldset
          legend={"Základní informace"}
          disabled={isLoadingOrSubmitting}
        >
          <Input
            label={"Pořadové číslo"}
            {...getInputProps(fields.ordinalNumber, { type: "number" })}
            step={1}
            errors={fields.ordinalNumber.errors}
          />
          <Input
            label={"Datum vydání"}
            {...getInputProps(fields.releasedAt, { type: "date" })}
            errors={fields.releasedAt.errors}
          />
        </Fieldset>

        <Fieldset legend={"Soubory"} disabled={isLoadingOrSubmitting}>
          <input {...getInputProps(fields.coverId, { type: "hidden" })} />
          <FileInput
            label={"Obálka"}
            accept={"image"}
            errors={fields.cover.errors}
            onChange={handleFileChange(fields.cover.name, fields.cover.dirty)}
            {...getInputProps(fields.cover, { type: "file" })}
          />
          <input {...getInputProps(fields.pdfId, { type: "hidden" })} />
          <FileInput
            label={"PDF"}
            accept={"pdf"}
            errors={fields.pdf.errors}
            onChange={handleFileChange(fields.pdf.name, fields.pdf.dirty)}
            {...getInputProps(fields.pdf, { type: "file" })}
          />
        </Fieldset>

        <Fieldset
          legend={"Informace o autorovi"}
          disabled={isLoadingOrSubmitting}
        >
          <Select
            label={"Autor"}
            errors={fields.authorId.errors}
            {...getSelectProps(fields.authorId)}
          >
            {loaderData.authors.map((author) => {
              return (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              )
            })}
          </Select>
        </Fieldset>

        <AuthenticityTokenInput />

        <FormActions>
          <Button type="submit" disabled={!canSubmit} variant={"primary"}>
            Upravit
          </Button>
          <AdminLinkButton
            to={href("/administration/archive/:issueId", { issueId: issue.id })}
          >
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdministrationPage>
  )
}

export { handle } from "./_handle"
export { meta } from "./_meta"
export { loader } from "./_loader"
export { action } from "./_action"
