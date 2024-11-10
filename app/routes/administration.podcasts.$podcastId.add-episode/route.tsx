import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { Form, useLoaderData } from "@remix-run/react"
import { useEffect, useState } from "react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { slugify } from "~/utils/slugify"

import { type action } from "./action"
import { type loader } from "./loader"
import { schema } from "./schema"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()
  const actionData = useLoaderData<typeof action>()

  const [form, fields] = useForm({
    id: "add-episode",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.lastResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    defaultValue: {
      description: "",
      publishedAt: new Date().toISOString().split("T")[0],
      podcastId: loaderData.podcast.id,
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
      setSlug(slugify(title))
    }
  }, [title, isSlugFocused])

  return (
    <>
      <h3>Přidat epizodu</h3>
      <Form method="post" {...getFormProps(form)}>
        <fieldset>
          <legend>Detaily</legend>
          <label htmlFor={fields.number.id}>Číslo: </label>
          <input
            {...getInputProps(fields.number, { type: "number" })}
            defaultValue={fields.number.initialValue}
          />
          {fields.number.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
          <br />
          <label htmlFor={fields.title.id}>Název: </label>
          <input
            {...getInputProps(fields.title, { type: "text" })}
            onChange={(event) => setTitle(event.target.value)}
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
            {...getInputProps(fields.description, { type: "text" })}
            defaultValue={fields.description.initialValue}
          />
          {fields.description.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
          <br />
          <label htmlFor={fields.published.id}>Publikováno: </label>
          <input {...getInputProps(fields.published, { type: "checkbox" })} />
          {fields.published.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
          <br />
          <label htmlFor={fields.publishedAt.id}>Publikováno dne: </label>
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
        <input
          {...getInputProps(fields.podcastId, { type: "hidden" })}
          defaultValue={fields.podcastId.initialValue}
        />
        <AuthenticityTokenInput />
        <br />
        <button type="submit">Přidat epizodu</button>
      </Form>
    </>
  )
}

export { meta } from "./meta"
export { loader } from "./loader"
export { action } from "./action"
