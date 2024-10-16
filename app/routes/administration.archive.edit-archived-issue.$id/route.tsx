import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { Form, useActionData, useLoaderData } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { type action } from "./action"
import { type loader } from "./loader"
import { schema } from "./schema"

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
      publishedAt: loaderData.archivedIssue.publishedAt?.split("T")[0],
      published: loaderData.archivedIssue.published,
      coverId: loaderData.archivedIssue.cover?.id,
      pdfId: loaderData.archivedIssue.pdf?.id,
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

  return (
    <>
      <h1>Upravit výtisk</h1>
      <Form
        {...getFormProps(form)}
        method={"post"}
        encType={"multipart/form-data"}
      >
        <input
          {...getInputProps(fields.id, { type: "hidden" })}
          defaultValue={fields.id.initialValue}
        />
        <fieldset>
          <legend>Popis</legend>
          <label htmlFor={fields.ordinalNumber.id}>Číslo výtisku</label>
          <input
            {...getInputProps(fields.ordinalNumber, { type: "number" })}
            step={1}
            defaultValue={fields.ordinalNumber.initialValue}
          />
          {fields.ordinalNumber.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
          <br />
          <label htmlFor={fields.publishedAt.id}>Datum vydání</label>
          <input
            {...getInputProps(fields.publishedAt, { type: "date" })}
            defaultValue={fields.publishedAt.initialValue}
          />
          {fields.publishedAt.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
        </fieldset>
        <fieldset>
          <legend>Soubory</legend>
          <input
            {...getInputProps(fields.coverId, { type: "hidden" })}
            defaultValue={fields.coverId.initialValue}
          />
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
          <input
            {...getInputProps(fields.pdfId, { type: "hidden" })}
            defaultValue={fields.pdfId.initialValue}
          />
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
        <fieldset>
          <legend>Stav</legend>
          <label htmlFor={fields.published.id}>Zveřejněno</label>
          <input {...getInputProps(fields.published, { type: "checkbox" })} />
        </fieldset>
        <AuthenticityTokenInput />
        <br />
        <button type="submit">Upravit</button>
      </Form>
    </>
  )
}

export { meta } from "./meta"
export { loader } from "./loader"
export { action } from "./action"
