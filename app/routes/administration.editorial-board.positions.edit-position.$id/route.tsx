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
      id: loaderData.editorialBoardPosition.id,
      key: loaderData.editorialBoardPosition.key,
      pluralLabel: loaderData.editorialBoardPosition.pluralLabel,
      currentOrder: loaderData.editorialBoardPosition.order,
      newOrder: loaderData.editorialBoardPosition.order,
    },
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  return (
    <>
      <h1>Upravit pozici</h1>
      <Form {...getFormProps(form)} method="post">
        <input
          {...getInputProps(fields.id, { type: "hidden" })}
          defaultValue={fields.id.initialValue}
        />
        <input
          {...getInputProps(fields.currentOrder, { type: "hidden" })}
          defaultValue={fields.currentOrder.initialValue}
        />
        <fieldset>
          <legend>Detaily pozice</legend>
          <label htmlFor={fields.key.id}>Unikátní klíč v angličtině: </label>
          <input
            {...getInputProps(fields.key, { type: "text" })}
            defaultValue={fields.key.initialValue}
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
            defaultValue={fields.pluralLabel.initialValue}
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
          <label htmlFor={fields.newOrder.id}>Pořadí: </label>
          <input
            {...getInputProps(fields.newOrder, { type: "number" })}
            defaultValue={fields.newOrder.initialValue}
            placeholder={"2"}
          />
          {fields.newOrder.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
        </fieldset>
        <AuthenticityTokenInput />
        <br />
        <Button type="submit">Upravit pozici</Button>
      </Form>
    </>
  )
}

export { meta } from "./meta"
export { loader } from "./loader"
export { action } from "./action"
