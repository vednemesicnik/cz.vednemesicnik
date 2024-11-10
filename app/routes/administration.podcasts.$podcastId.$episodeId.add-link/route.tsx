import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { Form, useLoaderData } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { type action } from "./action"
import { type loader } from "./loader"
import { schema } from "./schema"

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
        <AuthenticityTokenInput />
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
        <br />
        <button type="submit">Přidat odakz</button>
      </Form>
    </>
  )
}

export { meta } from "./meta"
export { loader } from "./loader"
export { action } from "./action"
