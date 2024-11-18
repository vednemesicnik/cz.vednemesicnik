import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { Form, useActionData, useLoaderData } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { canPublish, canUpdate } from "~/utils/permissions"

import { type action } from "./_action"
import { type loader } from "./_loader"
import { schema } from "./_schema"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  const [form, fields] = useForm({
    id: "edit-archived-issue-form",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.lastResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    defaultValue: {
      id: loaderData.archivedIssue.id,
      ordinalNumber: loaderData.archivedIssue.label.split("/")[0],
      releasedAt: loaderData.archivedIssue.releasedAt?.split("T")[0],
      published: loaderData.archivedIssue.published,
      publishedBefore: loaderData.archivedIssue.published,
      coverId: loaderData.archivedIssue.cover?.id,
      pdfId: loaderData.archivedIssue.pdf?.id,
      authorId: loaderData.archivedIssue.author.id,
    },
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  const handleFileChange = (dirty: boolean) => () => {
    if (!dirty) {
      form.validate()
    }
  }

  const permissions = loaderData.session.user.role.permissions
  const { user } = loaderData.session
  const { author } = loaderData.archivedIssue

  const { canUpdateOwn, canUpdateAny } = canUpdate(
    permissions,
    user.authorId,
    author.id
  )
  const { canPublishOwn, canPublishAny } = canPublish(
    permissions,
    user.authorId,
    author.id
  )

  return (
    <>
      <h3>Upravit výtisk</h3>
      <Form
        {...getFormProps(form)}
        method={"post"}
        encType={"multipart/form-data"}
      >
        <input {...getInputProps(fields.id, { type: "hidden" })} />
        <fieldset>
          <legend>Popis</legend>
          <label htmlFor={fields.ordinalNumber.id}>Číslo výtisku</label>
          <input
            {...getInputProps(fields.ordinalNumber, { type: "number" })}
            step={1}
          />
          {fields.ordinalNumber.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
          <br />
          <label htmlFor={fields.releasedAt.id}>Datum vydání</label>
          <input {...getInputProps(fields.releasedAt, { type: "date" })} />
          {fields.releasedAt.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
        </fieldset>
        <fieldset>
          <legend>Soubory</legend>
          <input {...getInputProps(fields.coverId, { type: "hidden" })} />
          <label htmlFor={fields.cover.id}>Obálka výtisku</label>
          <input
            {...getInputProps(fields.cover, { type: "file" })}
            onChange={handleFileChange(fields.cover.dirty)}
            accept={"image/*"}
          />
          {fields.cover.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
          <br />
          <input {...getInputProps(fields.pdfId, { type: "hidden" })} />
          <label htmlFor={fields.pdf.id}>PDF výtisku</label>
          <input
            {...getInputProps(fields.pdf, { type: "file" })}
            onChange={handleFileChange(fields.pdf.dirty)}
            accept="application/pdf"
          />
          {fields.pdf.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
        </fieldset>
        <fieldset disabled={!(canPublishOwn || canPublishAny)}>
          <legend>Stav</legend>
          <label htmlFor={fields.published.id}>Zveřejněno</label>
          <input {...getInputProps(fields.published, { type: "checkbox" })} />
          <input
            {...getInputProps(fields.publishedBefore, { type: "hidden" })}
          />
        </fieldset>
        <fieldset>
          <legend>Autor</legend>
          <label htmlFor={fields.authorId.id}>Autor</label>
          {/* from loaderData.user create select with names as options */}
          <select {...getSelectProps(fields.authorId)}>
            {loaderData.authors.map((author) => {
              return (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              )
            })}
          </select>
        </fieldset>
        <AuthenticityTokenInput />
        <br />
        <button type="submit" disabled={!(canUpdateOwn || canUpdateAny)}>
          Upravit
        </button>
      </Form>
    </>
  )
}

export { meta } from "./_meta"
export { loader } from "./_loader"
export { action } from "./_action"
