import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from "@conform-to/react"
import { Form, useActionData, useLoaderData } from "@remix-run/react"
import { Fragment } from "react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { Button } from "~/components/button"

import { type action } from "./_action"
import { type loader } from "./_loader"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  const [form, fields] = useForm({
    id: "edit-member",
    lastResult: actionData?.lastResult,
    defaultValue: {
      id: loaderData.editorialBoardMember.id,
      fullName: loaderData.editorialBoardMember.fullName,
      positionIds: loaderData.editorialBoardMember.positions.map(
        (position) => position.id
      ),
      authorId: loaderData.editorialBoardMember.authorId,
    },
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  return (
    <>
      <h3>Upravit člena</h3>
      <Form {...getFormProps(form)} method="post">
        <input
          {...getInputProps(fields.id, { type: "hidden" })}
          defaultValue={fields.id.initialValue}
        />
        <fieldset>
          <legend>Informace o členovi</legend>
          <label htmlFor={fields.fullName.id}> Celé jméno</label>
          <input
            {...getInputProps(fields.fullName, { type: "text" })}
            defaultValue={fields.fullName.initialValue}
            placeholder={"Jan Novák"}
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
          {loaderData.editorialBoardMemberPositions.map((position) => (
            <Fragment key={position.id}>
              <label>
                {position.key}
                <input
                  {...getInputProps(fields.positionIds, { type: "checkbox" })}
                  value={position.id}
                  defaultChecked={fields.positionIds.initialValue?.includes(
                    position.id
                  )}
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
        <Button type="submit">Upravit člena</Button>
      </Form>
    </>
  )
}

export { meta } from "./_meta"
export { loader } from "./_loader"
export { action } from "./_action"
