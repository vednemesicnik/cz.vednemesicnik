// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { href, useNavigation } from "react-router"

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
    id: "edit-link",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    defaultValue: {
      label: loaderData.link.label,
      url: loaderData.link.url,
      podcastId: loaderData.podcast.id,
      episodeId: loaderData.episode.id,
      linkId: loaderData.link.id,
      authorId: loaderData.link.authorId,
    },
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  const isLoadingOrSubmitting = state !== "idle"
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Upravit odkaz</AdminHeadline>

      <Form method={"post"} {...getFormProps(form)} errors={form.errors}>
        <input
          {...getInputProps(fields.podcastId, { type: "hidden" })}
          defaultValue={fields.podcastId.initialValue}
        />
        <input
          {...getInputProps(fields.episodeId, { type: "hidden" })}
          defaultValue={fields.episodeId.initialValue}
        />
        <input
          {...getInputProps(fields.linkId, { type: "hidden" })}
          defaultValue={fields.linkId.initialValue}
        />

        <Fieldset legend={"Detaily"} disabled={isLoadingOrSubmitting}>
          <Input
            label={"Štítek"}
            placeholder={"Poslechněte si na Spotify"}
            errors={fields.label.errors}
            {...getInputProps(fields.label, { type: "text" })}
          />
          <Input
            label={"URL"}
            placeholder={"https://open.spotify.com/episode/..."}
            errors={fields.url.errors}
            {...getInputProps(fields.url, { type: "url" })}
          />
        </Fieldset>

        <Fieldset legend={"Autor"} disabled={isLoadingOrSubmitting}>
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
          <Button type={"submit"} disabled={!canSubmit} variant={"primary"}>
            Uložit
          </Button>
          <AdminLinkButton
            to={href(
              "/administration/podcasts/:podcastId/episodes/:episodeId/links/:linkId",
              {
                podcastId: loaderData.podcast.id,
                episodeId: loaderData.episode.id,
                linkId: loaderData.link.id,
              }
            )}
          >
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
