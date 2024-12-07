// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { Form } from "react-router"

import { AuthenticityTokenInput } from "~/components/authenticity-token-input"
import { getRights } from "~/utils/permissions"

import type { Route } from "./+types/route"
import { schema } from "./_schema"

export default function Route({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { user } = loaderData.session

  const [form, fields] = useForm({
    id: "add-archived-issue",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    defaultValue: {
      ordinalNumber: "",
      releasedAt: new Date().toISOString().split("T")[0],
      authorId: user.author.id,
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

  const [[hasCreateRight, hasPublishRight]] = getRights(
    user.author.role.permissions,
    {
      actions: ["create", "publish"],
      access: ["own", "any"],
      ownId: user.author.id,
      targetId: fields.authorId.value,
    }
  )

  return (
    <>
      <h3>Přidat výtisk</h3>

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
        <fieldset disabled={!hasPublishRight}>
          <legend>Stav</legend>
          <label htmlFor={fields.published.id}>Zveřejněno</label>
          <input {...getInputProps(fields.published, { type: "checkbox" })} />
        </fieldset>
        <fieldset>
          <legend>Autor</legend>
          <label htmlFor={fields.authorId.id}>Autor</label>
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
        <button type="submit" disabled={!hasCreateRight}>
          Přidat
        </button>
      </Form>
    </>
  )
}

export { action } from "./_action"
export { loader } from "./_loader"
export { meta } from "./_meta"
