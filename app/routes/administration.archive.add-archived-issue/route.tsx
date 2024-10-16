import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { Form, useActionData } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { type action } from "./action"
import { schema } from "./schema"

export default function Route() {
  const actionData = useActionData<typeof action>()

  const [form, fields] = useForm({
    id: "add-archived-issue",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.lastResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    defaultValue: {
      ordinalNumber: "",
      publishedAt: new Date().toISOString().split("T")[0],
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
      <h1>Přidat výtisk</h1>

      <Form
        method={"post"}
        encType={"multipart/form-data"}
        {...getFormProps(form)}
      >
        <fieldset>
          <legend>Popis</legend>
          <label htmlFor={fields.ordinalNumber.id}>Číslo výtisku</label>
          <input
            {...getInputProps(fields.ordinalNumber, { type: "number" })}
            placeholder={"1"}
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
          <label htmlFor={fields.cover.id}>Obálka výtisku</label>
          <input
            {...getInputProps(fields.cover, { type: "file" })}
            accept={"image/*"}
            onChange={handleFileChange(fields.cover.dirty)}
          />
          {fields.cover.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
          <br />
          <label htmlFor={fields.pdf.id}>PDF výtisku</label>
          <input
            {...getInputProps(fields.pdf, { type: "file" })}
            accept="application/pdf"
            onChange={handleFileChange(fields.pdf.dirty)}
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
        <button type="submit">Přidat</button>
      </Form>
    </>
  )
}

export { meta } from "./meta"
export { loader } from "./loader"
export { action } from "./action"
