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
import { AuthenticityTokenInput } from "~/components/authenticity-token-input"
import { Button } from "~/components/button"
import { Fieldset } from "~/components/fieldset/_component"
import { FileInput } from "~/components/file-input"
import { Form } from "~/components/form"
import { FormActions } from "~/components/form-actions"
import { Input } from "~/components/input"
import { Select } from "~/components/select"
import { getFormattedDateString } from "~/utils/get-formatted-date-string"

import type { Route } from "./+types/route"
import { schema } from "./_schema"

export { handle } from "./_handle"
export { action } from "./_action"
export { loader } from "./_loader"
export { meta } from "./_meta"

export default function Route({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { state } = useNavigation()

  const [form, fields] = useForm({
    id: "add-archived-issue",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    defaultValue: {
      ordinalNumber: "",
      releasedAt: getFormattedDateString(new Date()),
      authorId: loaderData.selfAuthorId,
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
    <>
      <AdminHeadline>Přidat číslo</AdminHeadline>

      <Form
        method={"post"}
        encType={"multipart/form-data"}
        {...getFormProps(form)}
        errors={form.errors}
      >
        <Fieldset
          legend={"Základní informace"}
          disabled={isLoadingOrSubmitting}
        >
          <Input
            label={"Pořadové číslo"}
            {...getInputProps(fields.ordinalNumber, { type: "number" })}
            placeholder={"1"}
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
          <FileInput
            label={"Obálka"}
            accept={"image"}
            onChange={handleFileChange(fields.cover.name, fields.cover.dirty)}
            errors={fields.cover.errors}
            {...getInputProps(fields.cover, { type: "file" })}
          />
          <FileInput
            label={"PDF"}
            accept={"pdf"}
            onChange={handleFileChange(fields.pdf.name, fields.pdf.dirty)}
            errors={fields.pdf.errors}
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
          <AdminLinkButton to={"/administration/archive"}>
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </>
  )
}
