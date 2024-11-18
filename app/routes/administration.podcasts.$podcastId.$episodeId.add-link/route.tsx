import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { Form, useLoaderData } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { type action } from "./_action"
import { type loader } from "./_loader"
import { schema } from "./_schema"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()
  const actionData = useLoaderData<typeof action>()

  const [form, fields] = useForm({
    id: "add-link",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.lastResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    defaultValue: {
      label: "",
      url: "",
      podcastId: loaderData.podcast.id,
      episodeId: loaderData.episode.id,
      authorId: loaderData.session.user.authorId,
    },
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  return (
    <>
      <h3>Přidat link</h3>
      <Form {...getFormProps(form)} method="post">
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
          <label htmlFor={fields.label.id}>Štítek: </label>
          <input
            {...getInputProps(fields.label, { type: "text" })}
            defaultValue={fields.label.initialValue}
            placeholder={"Poslechněte si na Spotify"}
          />
          {fields.label.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
          <br />
          <label htmlFor={fields.url.id}>URL: </label>
          <input
            {...getInputProps(fields.url, { type: "url" })}
            defaultValue={fields.url.initialValue}
            placeholder={"https://open.spotify.com/episode/..."}
          />
          {fields.url.errors?.map((error) => {
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
        <button type="submit">Přidat odakz</button>
      </Form>
    </>
  )
}

export { meta } from "./_meta"
export { loader } from "./_loader"
export { action } from "./_action"
