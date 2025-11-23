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

import { AuthenticityTokenInput } from "~/components/authenticity-token-input"
import { Button } from "~/components/button"
import { Fieldset } from "~/components/fieldset"
import { FileInput } from "~/components/file-input"
import { Form } from "~/components/form"
import { FormActions } from "~/components/form-actions"
import { Headline } from "~/components/headline"
import { Input } from "~/components/input"
import { LinkButton } from "~/components/link-button"
import { Select } from "~/components/select"
import { TextArea } from "~/components/text-area"
import { getFormattedDateString } from "~/utils/get-formatted-date-string"
import { slugify } from "~/utils/slugify"

import type { Route } from "./+types/route"
import { schema } from "./_schema"

export default function Route({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [form, fields] = useForm({
    id: "add-podcast",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.submissionResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    defaultValue: {
      id: loaderData.podcast.id,
      description: loaderData.podcast.description,
      coverId: loaderData.podcast.cover?.id,
      authorId: loaderData.session.user.authorId,
      publishedAt: getFormattedDateString(loaderData.podcast.publishedAt),
    },
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  const [title, setTitle] = useState(loaderData.podcast.title)
  const [slug, setSlug] = useState(loaderData.podcast.slug)
  const [isSlugFocused, setIsSlugFocused] = useState(false)

  useEffect(() => {
    if (!isSlugFocused) {
      setSlug(slugify(title))
    }
  }, [title, isSlugFocused])

  return (
    <>
      <Headline>Upravit podcast</Headline>
      <Form
        {...getFormProps(form)}
        encType={"multipart/form-data"}
        method="post"
      >
        <input
          {...getInputProps(fields.id, { type: "hidden" })}
          defaultValue={fields.id.initialValue}
        />
        <input
          {...getInputProps(fields.coverId, { type: "hidden" })}
          defaultValue={fields.coverId.initialValue}
        />

        <Fieldset legend={"Detaily"}>
          <Input
            label={"Název"}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={"Název podcastu"}
            value={title}
            errors={fields.title.errors}
            {...getInputProps(fields.title, { type: "text" })}
          />

          <Input
            label={"Slug"}
            onChange={(event) => setSlug(slugify(event.target.value))}
            onFocus={() => setIsSlugFocused(true)}
            placeholder={"slug-podcastu"}
            value={slug}
            errors={fields.slug.errors}
            {...getInputProps(fields.slug, { type: "text" })}
          />

          <TextArea
            label={"Popis"}
            placeholder={"Popis podcastu"}
            errors={fields.description.errors}
            {...getTextareaProps(fields.description)}
          />

          <Input
            label={"Datum vydání"}
            errors={fields.publishedAt.errors}
            {...getInputProps(fields.publishedAt, { type: "date" })}
          />

          <FileInput
            label={"Obálka"}
            accept={"image"}
            errors={fields.cover.errors}
            {...getInputProps(fields.cover, { type: "file" })}
          />
        </Fieldset>

        <Fieldset legend={"Informace o autorovi"}>
          <Select
            label={"Autor"}
            errors={fields.authorId.errors}
            {...getSelectProps(fields.authorId)}
          >
            {loaderData.authors.map((author) => {
              return (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              )
            })}
          </Select>
        </Fieldset>

        <AuthenticityTokenInput />

        <FormActions>
          <Button type="submit" variant={"default"}>
            Upravit
          </Button>
          <LinkButton to={"/administration/podcasts"}>Zrušit</LinkButton>
        </FormActions>
      </Form>
    </>
  )
}

export { handle } from "./_handle"
export { meta } from "./_meta"
export { loader } from "./_loader"
export { action } from "./_action"
