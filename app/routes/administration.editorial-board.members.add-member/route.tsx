import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { Form, useActionData, useLoaderData } from "@remix-run/react"
import { Fragment } from "react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { Button } from "~/components/button"

import { type action } from "./action"
import { type loader } from "./loader"
import { schema } from "./schema"

export default function Route() {
  const data = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  const [form, fields] = useForm({
    id: "add-member",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.lastResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    defaultValue: {
      fullName: "",
      positionIds: [],
    },
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  return (
    <>
      <h3>Přidat člena</h3>
      <Form {...getFormProps(form)} method="post">
        <fieldset>
          <legend>Informace o členovi</legend>
          <label htmlFor={fields.fullName.id}> Celé jméno</label>
          <input
            {...getInputProps(fields.fullName, { type: "text" })}
            placeholder={"Jan Novák"}
            defaultValue={fields.fullName.initialValue}
          />
          {fields.fullName.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
        </fieldset>
        <fieldset>
          <legend>Pozice</legend>
          {data.editorialBoardMemberPositions.map((position) => (
            <Fragment key={position.id}>
              <label>
                {position.key}
                <input
                  {...getInputProps(fields.positionIds, { type: "checkbox" })}
                  value={position.id}
                />
              </label>
              <br />
            </Fragment>
          ))}
          {fields.positionIds.errors?.map((error) => {
            return (
              <output key={error} style={{ color: "red" }}>
                {error}
              </output>
            )
          })}
        </fieldset>
        <AuthenticityTokenInput />
        <br />
        <Button type="submit">Přidat člena</Button>
      </Form>
    </>
  )
}

export { meta } from "./meta"
export { loader } from "./loader"
export { action } from "./action"
