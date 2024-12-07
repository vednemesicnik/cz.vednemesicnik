// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { useEffect, useRef } from "react"
import { Form } from "react-router"

import { AuthenticityTokenInput } from "~/components/authenticity-token-input"
import { getRights } from "~/utils/permissions"

import type { Route } from "./+types/route"
import { schema } from "./_schema"

export default function Route({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const publishedInputRef = useRef<HTMLInputElement>(null)

  const { issue, session } = loaderData
  const { user } = session

  const [form, fields] = useForm({
    id: "edit-archived-issue-form",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    defaultValue: {
      id: issue.id,
      ordinalNumber: issue.label.split("/")[0],
      releasedAt: issue.releasedAt?.toISOString().split("T")[0],
      published: issue.state === "published",
      publishedBefore: issue.state === "published",
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

  const handleFileChange = (dirty: boolean) => () => {
    if (!dirty) {
      form.validate()
    }
  }

  const [[hasUpdateRight, hasPublishRight]] = getRights(
    user.author.role.permissions,
    {
      actions: ["update", "publish"],
      access: ["own", "any"],
      ownId: user.author.id,
      targetId: fields.authorId.value || issue.author.id,
    }
  )

  const publishedBeforeValue = issue.state === "published"

  useEffect(() => {
    const publishedInput = publishedInputRef.current
    if (publishedInput !== null && !hasPublishRight) {
      publishedInput.checked = publishedBeforeValue
    }
  }, [hasPublishRight, publishedBeforeValue])

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
        <fieldset disabled={!hasPublishRight}>
          <legend>Stav</legend>
          <label htmlFor={fields.published.id}>Zveřejněno</label>
          <input
            {...getInputProps(fields.published, { type: "checkbox" })}
            ref={publishedInputRef}
          />
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
        <button type="submit" disabled={!hasUpdateRight}>
          Upravit
        </button>
      </Form>
    </>
  )
}

export { meta } from "./_meta"
export { loader } from "./_loader"
export { action } from "./_action"
