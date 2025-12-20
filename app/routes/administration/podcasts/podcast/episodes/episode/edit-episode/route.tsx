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
import { useNavigation } from "react-router"

import { AdminHeadline } from "~/components/admin-headline"
import { AdminLinkButton } from "~/components/admin-link-button"
import { AdminPage } from "~/components/admin-page"
import { AuthenticityTokenInput } from "~/components/authenticity-token-input"
import { Button } from "~/components/button"
import { Fieldset } from "~/components/fieldset"
import { Form } from "~/components/form"
import { FormActions } from "~/components/form-actions"
import { Input } from "~/components/input"
import { Select } from "~/components/select"
import { TextArea } from "~/components/text-area"
import { slugify } from "~/utils/slugify"

import type { Route } from "./+types/route"
import { schema } from "./_schema"

export { handle } from "./_handle"
export { action } from "./_action"
export { loader } from "./_loader"
export { meta } from "./_meta"

export default function Route({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { state } = useNavigation()

  const [form, fields] = useForm({
    id: "edit-episode",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    defaultValue: {
      number: loaderData.episode.number,
      description: loaderData.episode.description,
      podcastId: loaderData.podcastId,
      episodeId: loaderData.episode.id,
      authorId: loaderData.episode.authorId,
    },
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  const [title, setTitle] = useState(loaderData.episode.title)
  const [slug, setSlug] = useState(loaderData.episode.slug)
  const [isSlugFocused, setIsSlugFocused] = useState(false)

  useEffect(() => {
    if (!isSlugFocused) {
      setSlug(slugify(title ?? ""))
    }
  }, [title, isSlugFocused])

  const isLoadingOrSubmitting = state !== "idle"
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Upravit epizodu</AdminHeadline>

      <Form method={"post"} {...getFormProps(form)} errors={form.errors}>
        <input
          {...getInputProps(fields.podcastId, { type: "hidden" })}
          defaultValue={fields.podcastId.initialValue}
        />
        <input
          {...getInputProps(fields.episodeId, { type: "hidden" })}
          defaultValue={fields.episodeId.initialValue}
        />

        <Fieldset legend={"Detaily"} disabled={isLoadingOrSubmitting}>
          <Input
            label={"Číslo"}
            placeholder={"Číslo epizody"}
            errors={fields.number.errors}
            {...getInputProps(fields.number, { type: "number" })}
          />

          <Input
            label={"Název"}
            placeholder={"Název epizody"}
            onChange={(event) => setTitle(event.target.value)}
            value={title}
            errors={fields.title.errors}
            {...getInputProps(fields.title, { type: "text" })}
          />

          <Input
            label={"Slug"}
            placeholder={"nazev-epizody"}
            onChange={(event) => setSlug(slugify(event.target.value))}
            onFocus={() => setIsSlugFocused(true)}
            value={slug}
            errors={fields.slug.errors}
            {...getInputProps(fields.slug, { type: "text" })}
          />

          <TextArea
            label={"Popis"}
            placeholder={"Popis epizody"}
            errors={fields.description.errors}
            {...getTextareaProps(fields.description)}
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
            {loaderData.authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </Select>
        </Fieldset>

        <AuthenticityTokenInput />

        <FormActions>
          <Button type="submit" disabled={!canSubmit} variant={"primary"}>
            Uložit
          </Button>
          <AdminLinkButton
            to={`/administration/podcasts/${loaderData.podcastId}/episodes/${loaderData.episode.id}`}
          >
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
