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
import { Button } from "~/components/button"

import type { Route } from "./+types/route"
import { getSchema } from "./_schema"

export default function Route({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [form, fields] = useForm({
    id: "add-position",
    constraint: getZodConstraint(
      getSchema(loaderData.editorialBoardPositionsCount)
    ),
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) =>
      parseWithZod(formData, {
        schema: getSchema(loaderData.editorialBoardPositionsCount),
      }),
    defaultValue: {
      key: "",
      pluralLabel: "",
      order: "",
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
      <h3>Přidat pozici</h3>
      <Form {...getFormProps(form)} method="post">
        <fieldset>
          <legend>Detaily pozice</legend>
          <label htmlFor={fields.key.id}>Unikátní klíč v angličtině: </label>
          <input
            {...getInputProps(fields.key, { type: "text" })}
            placeholder={"editor"}
          />
          {fields.key.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
          <br />
          <label htmlFor={fields.pluralLabel.id}>
            Označení v množném čísle:{" "}
          </label>
          <input
            {...getInputProps(fields.pluralLabel, { type: "text" })}
            placeholder={"redaktorky a redaktoři"}
          />
          {fields.pluralLabel.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
          <br />
          <label htmlFor={fields.order.id}>Pořadí: </label>
          <input
            {...getInputProps(fields.order, { type: "number" })}
            placeholder={"2"}
          />
          {fields.order.errors?.map((error) => {
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
        <Button type="submit">Přidat pozici</Button>
      </Form>
    </>
  )
}

export { meta } from "./_meta"
export { loader } from "./_loader"
export { action } from "./_action"
