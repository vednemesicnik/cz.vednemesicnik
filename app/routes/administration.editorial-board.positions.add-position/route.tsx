// noinspection JSUnusedGlobalSymbols

import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { Form, useActionData, useLoaderData } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { Button } from "~/components/button"

import { type action } from "./action"
import { type loader } from "./loader"
import { getSchema } from "./schema"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  const [form, fields] = useForm({
    id: "add-position",
    constraint: getZodConstraint(
      getSchema(loaderData.editorialBoardPositionsCount)
    ),
    lastResult: actionData?.lastResult,
    onValidate: ({ formData }) =>
      parseWithZod(formData, {
        schema: getSchema(loaderData.editorialBoardPositionsCount),
      }),
    defaultValue: {
      key: "",
      pluralLabel: "",
      order: "",
    },
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  return (
    <>
      <h1>Přidat pozici</h1>
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
        <AuthenticityTokenInput />
        <br />
        <Button type="submit">Přidat pozici</Button>
      </Form>
    </>
  )
}

export { meta } from "./meta"
export { loader } from "./loader"
export { action } from "./action"
