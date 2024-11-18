import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { Form, useActionData, useLoaderData } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { Button } from "~/components/button"

import { type action } from "./_action"
import { type loader } from "./_loader"
import { getSchema } from "./_schema"

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
      authorId: loaderData.editorialBoardPosition.authorId,
    },
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  return (
    <>
      <h3>Upravit pozici</h3>
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
        <Button type="submit">Upravit pozici</Button>
      </Form>
    </>
  )
}

export { action } from "./_action"
export { loader } from "./_loader"
export { meta } from "./_meta"
