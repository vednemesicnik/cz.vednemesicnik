import {
  getFormProps,
  getInputProps,
  getTextareaProps,
  useForm,
} from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { Form, useActionData } from "@remix-run/react"
import { useEffect, useState } from "react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { slugify } from "~/utils/slugify"

import { type action } from "./action"
import { schema } from "./schema"

export default function Route() {
  const actionData = useActionData<typeof action>()

  const [form, fields] = useForm({
    id: "add-podcast",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    defaultValue: {
      description: "",
    },
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [isSlugFocused, setIsSlugFocused] = useState(false)

  useEffect(() => {
    if (!isSlugFocused) {
      setSlug(slugify(title ?? ""))
    }
  }, [title, isSlugFocused])

  return (
    <>
      <h1>Přidat podcast</h1>
      <Form
        {...getFormProps(form)}
        encType={"multipart/form-data"}
        method="post"
      >
        <fieldset>
          <legend>Detaily</legend>
          <label htmlFor={fields.title.id}>Název: </label>
          <input
            {...getInputProps(fields.title, { type: "text" })}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={"Název podcastu"}
            value={title}
          />
          {fields.title.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
          <br />
          <label htmlFor={fields.slug.id}>Slug: </label>
          <input
            {...getInputProps(fields.slug, { type: "text" })}
            onChange={(event) => setSlug(slugify(event.target.value))}
            onFocus={() => setIsSlugFocused(true)}
            placeholder={"slug-podcastu"}
            value={slug}
          />
          {fields.slug.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
          <br />
          <label htmlFor={fields.description.id}>Popis: </label>
          <textarea
            {...getTextareaProps(fields.description)}
            defaultValue={fields.description.initialValue}
            placeholder={"Popis podcastu"}
          />
          {fields.description.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
          <br />
          <label htmlFor={fields.cover.id}>Obálka: </label>
          <input
            {...getInputProps(fields.cover, { type: "file" })}
            accept={"image/*"}
          />
          {fields.cover.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
        </fieldset>
        <AuthenticityTokenInput />
        <br />
        <button type="submit">Přidat podcast</button>
      </Form>
    </>
  )
}

export { meta } from "./meta"
export { loader } from "./loader"
export { action } from "./action"
