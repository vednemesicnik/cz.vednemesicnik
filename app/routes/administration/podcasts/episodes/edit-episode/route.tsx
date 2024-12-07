// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  getTextareaProps,
  useForm,
} from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { useEffect, useState } from "react"
import { Form } from "react-router"

import { AuthenticityTokenInput } from "~/components/authenticity-token-input"
import { slugify } from "~/utils/slugify"

import type { Route } from "./+types/route"
import { schema } from "./_schema"

export default function Route({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [form, fields] = useForm({
    id: "edit-episode",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    defaultValue: {
      number: loaderData.episode.number,
      description: loaderData.episode.description,
      published: loaderData.episode.state === "published",
      publishedAt: loaderData.episode.publishedAt?.toISOString().split("T")[0],
      podcastId: loaderData.podcast.id,
      episodeId: loaderData.episode.id,
      authorId: loaderData.episode.authorId,
    },
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  const [title, setTitle] = useState(loaderData.episode.title)
  const [slug, setSlug] = useState(loaderData.episode.slug)
  const [isSlugFocused, setIsSlugFocused] = useState(false)

  useEffect(() => {
    if (!isSlugFocused) {
      setSlug(slugify(title))
    }
  }, [title, isSlugFocused])

  return (
    <>
      <h3>Upavit epizodu</h3>
      <Form
        {...getFormProps(form)}
        encType={"multipart/form-data"}
        method="post"
      >
        <input
          {...getInputProps(fields.podcastId, { type: "hidden" })}
          defaultValue={fields.podcastId.initialValue}
        />
        <input
          {...getInputProps(fields.episodeId, { type: "hidden" })}
          defaultValue={fields.episodeId.initialValue}
        />
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
            {...getTextareaProps(fields.description)}
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
        <button type="submit">Upravit epizodu</button>
      </Form>
    </>
  )
}

export { meta } from "./_meta"
export { loader } from "./_loader"
export { action } from "./_action"
