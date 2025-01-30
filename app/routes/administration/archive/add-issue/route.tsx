// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"

import { AuthenticityTokenInput } from "~/components/authenticity-token-input"
import { Button } from "~/components/button"
import { Fieldset } from "~/components/fieldset/_component"
import { FileInput } from "~/components/file-input"
import { Form } from "~/components/form"
import { FormActions } from "~/components/form-actions"
import { Headline } from "~/components/headline"
import { Input } from "~/components/input"
import { LinkButton } from "~/components/link-button"
import { Select } from "~/components/select"
import { contentStateConfig } from "~/config/content-state-config"
import { getAuthorRights } from "~/utils/get-author-rights"
import { getFormattedDateString } from "~/utils/get-formatted-date-string"

import type { Route } from "./+types/route"
import { schema } from "./_schema"

export default function Route({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { user } = loaderData.session

  const [form, fields] = useForm({
    id: "add-archived-issue",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    defaultValue: {
      ordinalNumber: "",
      releasedAt: getFormattedDateString(new Date()),
      authorId: user.author.id,
    },
    shouldDirtyConsider: (field) => {
      return !field.startsWith("csrf")
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
  })

  const handleFileChange = (name: string, dirty: boolean) => () => {
    if (dirty) {
      form.validate({ name })
    }
  }

  const [
    // entity: "issue"
    [
      // action: "create"
      [
        // access: "own"
        [
          hasCreateOwnDraftIssueRight,
          hasCreateOwnPublishedIssueRight,
          hasCreateOwnArchivedIssueRight,
        ],
        // access: "any"
        [
          hasCreateAnyDraftIssueRight,
          hasCreateAnyPublishedIssueRight,
          hasCreateAnyArchivedIssueRight,
        ],
      ],
    ],
  ] = getAuthorRights(user.author.role.permissions, {
    entities: ["issue"],
    actions: ["create"],
    access: ["own", "any"],
    states: ["draft", "published", "archived"],
    ownId: user.author.id,
    targetId: fields.authorId.value,
  })

  const canCreateDraftIssue =
    hasCreateOwnDraftIssueRight || hasCreateAnyDraftIssueRight
  const canCreatePublishedIssue =
    hasCreateOwnPublishedIssueRight || hasCreateAnyPublishedIssueRight
  const canCreateArchivedIssue =
    hasCreateOwnArchivedIssueRight || hasCreateAnyArchivedIssueRight

  const contentStates = contentStateConfig.states.filter((state) => {
    switch (state) {
      case "draft":
        return canCreateDraftIssue
      case "published":
        return canCreatePublishedIssue
      case "archived":
        return canCreateArchivedIssue
      default:
        return false
    }
  })

  const contentStatesMap = contentStateConfig.selectMap

  return (
    <>
      <Headline>Přidat číslo</Headline>

      <Form
        method={"post"}
        encType={"multipart/form-data"}
        {...getFormProps(form)}
        errors={form.errors}
      >
        <Fieldset legend={"Základní informace"}>
          <Input
            label={"Pořadové číslo"}
            {...getInputProps(fields.ordinalNumber, { type: "number" })}
            placeholder={"1"}
            step={1}
            errors={fields.ordinalNumber.errors}
          />
          <Input
            label={"Datum vydání"}
            {...getInputProps(fields.releasedAt, { type: "date" })}
            errors={fields.releasedAt.errors}
          />
        </Fieldset>

        <Fieldset legend={"Soubory"}>
          <FileInput
            label={"Obálka"}
            accept={"image"}
            onChange={handleFileChange(fields.cover.name, fields.cover.dirty)}
            errors={fields.cover.errors}
            {...getInputProps(fields.cover, { type: "file" })}
          />
          <FileInput
            label={"PDF"}
            accept={"pdf"}
            onChange={handleFileChange(fields.pdf.name, fields.pdf.dirty)}
            errors={fields.pdf.errors}
            {...getInputProps(fields.pdf, { type: "file" })}
          />
        </Fieldset>

        <Fieldset legend={"Stav publikace"}>
          <Select label={"Stav"} {...getSelectProps(fields.state)}>
            {contentStates.map((state, index) => (
              <option key={index} value={state}>
                {contentStatesMap[state]}
              </option>
            ))}
          </Select>
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
          <Button
            type="submit"
            disabled={contentStates.length === 0}
            variant={"default"}
          >
            Přidat
          </Button>
          <LinkButton to={"/administration/archive"}>Zrušit</LinkButton>
        </FormActions>
      </Form>
    </>
  )
}

export { handle } from "./_handle"
export { action } from "./_action"
export { loader } from "./_loader"
export { meta } from "./_meta"
