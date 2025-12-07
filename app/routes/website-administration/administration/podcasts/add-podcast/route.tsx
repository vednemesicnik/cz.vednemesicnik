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

import { AdminHeadline } from "~/components/admin-headline"
import { AdminLinkButton } from "~/components/admin-link-button"
import { AdministrationPage } from "~/components/administration-page"
import { AuthenticityTokenInput } from "~/components/authenticity-token-input"
import { Button } from "~/components/button"
import { Fieldset } from "~/components/fieldset"
import { FileInput } from "~/components/file-input"
import { Form } from "~/components/form"
import { FormActions } from "~/components/form-actions"
import { Input } from "~/components/input"
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
      authorId: loaderData.session.user.author.id,
      publishedAt: getFormattedDateString(new Date()),
    },
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [isSlugFocused, setIsSlugFocused] = useState(false)

  useEffect(() => {
    if (!isSlugFocused) {
      setSlug(slugify(title ?? ""))
    }
  }, [title, isSlugFocused])

  return (
    <AdministrationPage>
      <AdminHeadline>Přidat podcast</AdminHeadline>
      <Form
        {...getFormProps(form)}
        encType={"multipart/form-data"}
        method="post"
      >
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
            placeholder={"nazev-podcastu"}
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
            {loaderData.authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </Select>
        </Fieldset>

        <AuthenticityTokenInput />

        <FormActions>
          <Button type="submit" variant={"primary"}>
            Přidat
          </Button>
          <AdminLinkButton to={"/administration/podcasts"}>
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdministrationPage>
  )
}

export { handle } from "./_handle"
export { meta } from "./_meta"
export { loader } from "./_loader"
export { action } from "./_action"
