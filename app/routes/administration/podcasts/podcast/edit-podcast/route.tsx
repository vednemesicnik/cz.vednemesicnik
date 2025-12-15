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
import { href, useNavigation } from "react-router"

import { AdminHeadline } from "~/components/admin-headline"
import { AdminLinkButton } from "~/components/admin-link-button"
import { AdminPage } from "~/components/admin-page"
import { AuthenticityTokenInput } from "~/components/authenticity-token-input"
import { Button } from "~/components/button"
import { Fieldset } from "~/components/fieldset"
import { FileInput } from "~/components/file-input"
import { Form } from "~/components/form"
import { FormActions } from "~/components/form-actions"
import { Input } from "~/components/input"
import { Select } from "~/components/select"
import { TextArea } from "~/components/text-area"
import { slugify } from "~/utils/slugify"

import type { Route } from "./+types/route"
import { schema } from "./_schema"

export default function Route({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { podcast } = loaderData
  const { state } = useNavigation()

  const [form, fields] = useForm({
    id: "edit-podcast-form",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    defaultValue: {
      id: podcast.id,
      description: podcast.description,
      coverId: podcast.cover?.id,
      authorId: podcast.author.id,
    },
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  const [title, setTitle] = useState(podcast.title)
  const [slug, setSlug] = useState(podcast.slug)
  const [isSlugFocused, setIsSlugFocused] = useState(false)

  useEffect(() => {
    if (!isSlugFocused) {
      setSlug(slugify(title))
    }
  }, [title, isSlugFocused])

  const handleFileChange = (name: string, dirty: boolean) => () => {
    if (dirty) {
      form.validate({ name })
    }
  }

  const isLoadingOrSubmitting = state !== "idle"
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Upravit podcast ({podcast.title})</AdminHeadline>
      <Form
        {...getFormProps(form)}
        method={"post"}
        encType={"multipart/form-data"}
        errors={form.errors}
      >
        <input {...getInputProps(fields.id, { type: "hidden" })} />

        <Fieldset legend={"Detaily"} disabled={isLoadingOrSubmitting}>
          <Input
            label={"Název"}
            placeholder={"Název podcastu"}
            onChange={(event) => setTitle(event.target.value)}
            value={title}
            errors={fields.title.errors}
            {...getInputProps(fields.title, { type: "text" })}
          />

          <Input
            label={"Slug"}
            placeholder={"nazev-podcastu"}
            onChange={(event) => setSlug(slugify(event.target.value))}
            onFocus={() => setIsSlugFocused(true)}
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

          <input {...getInputProps(fields.coverId, { type: "hidden" })} />
          <FileInput
            label={"Obálka"}
            accept={"image"}
            onChange={handleFileChange(fields.cover.name, fields.cover.dirty)}
            errors={fields.cover.errors}
            {...getInputProps(fields.cover, { type: "file" })}
          />
        </Fieldset>

        <Fieldset
          legend={"Informace o autorovi"}
          disabled={isLoadingOrSubmitting}
        >
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
          <Button type="submit" disabled={!canSubmit} variant={"primary"}>
            Upravit
          </Button>
          <AdminLinkButton
            to={href("/administration/podcasts/:podcastId", {
              podcastId: podcast.id,
            })}
          >
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}

export { handle } from "./_handle"
export { meta } from "./_meta"
export { loader } from "./_loader"
export { action } from "./_action"
