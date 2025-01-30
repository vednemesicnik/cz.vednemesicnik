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
import { Fieldset } from "~/components/fieldset"
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
import { getIssueOrdinalNumber } from "~/utils/get-issue-ordinal-number"

import type { Route } from "./+types/route"
import { schema } from "./_schema"

export default function Route({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { issue, session } = loaderData
  const { user } = session

  const [form, fields] = useForm({
    id: "edit-archived-issue-form",
    constraint: getZodConstraint(schema),
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    defaultValue: {
      id: issue.id,
      ordinalNumber: getIssueOrdinalNumber(issue.label),
      releasedAt: getFormattedDateString(issue.releasedAt),
      coverId: issue.cover?.id,
      pdfId: issue.pdf?.id,
      state: issue.state,
      publishedAt: getFormattedDateString(issue.publishedAt),
      authorId: issue.author.id,
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
      // action: "update"
      [
        // access: "own"
        [hasUpdateOwnIssueRight],
        // access: "any"
        [hasUpdateAnyIssueRight],
      ],
      // action: "publish"
      [
        // access: "own"
        [hasPublishOwnIssueRight],
        // access: "any"
        [hasPublishAnyIssueRight],
      ],
      // action: "retract"
      [
        // access: "own"
        [hasRetractOwnIssueRight],
        // access: "any"
        [hasRetractAnyIssueRight],
      ],
      // action: "archive"
      [
        // access: "own"
        [hasArchiveOwnIssueRight],
        // access: "any"
        [hasArchiveAnyIssueRight],
      ],
      // action: "restore"
      [
        // access: "own"
        [hasRestoreOwnIssueRight],
        // access: "any"
        [hasRestoreAnyIssueRight],
      ],
    ],
  ] = getAuthorRights(user.author.role.permissions, {
    entities: ["issue"],
    actions: ["update", "publish", "retract", "archive", "restore"],
    access: ["own", "any"],
    states: [issue.state],
    ownId: user.author.id,
    targetId: fields.authorId.value || issue.author.id,
  })

  console.log({ authorPermissions: user.author.role.permissions })

  const contentStates = contentStateConfig.states.filter((state) => {
    switch (state) {
      case "draft":
        return (
          (issue.state === "draft" &&
            (hasUpdateOwnIssueRight || hasUpdateAnyIssueRight)) ||
          hasRetractOwnIssueRight ||
          hasRetractAnyIssueRight ||
          hasRestoreOwnIssueRight ||
          hasRestoreAnyIssueRight
        )
      case "published":
        return (
          (issue.state === "published" &&
            (hasUpdateOwnIssueRight || hasUpdateAnyIssueRight)) ||
          hasPublishOwnIssueRight ||
          hasPublishAnyIssueRight
        )
      case "archived":
        return (
          (issue.state === "archived" &&
            (hasUpdateOwnIssueRight || hasUpdateAnyIssueRight)) ||
          hasArchiveOwnIssueRight ||
          hasArchiveAnyIssueRight
        )
      default:
        return false
    }
  })

  const contentStatesMap = contentStateConfig.selectMap

  return (
    <>
      <Headline>Upravit číslo</Headline>
      <Form
        {...getFormProps(form)}
        method={"post"}
        encType={"multipart/form-data"}
        errors={form.errors}
      >
        <input {...getInputProps(fields.id, { type: "hidden" })} />

        <Fieldset legend={"Základní informace"}>
          <Input
            label={"Pořadové číslo"}
            {...getInputProps(fields.ordinalNumber, { type: "number" })}
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
          <input {...getInputProps(fields.coverId, { type: "hidden" })} />
          <FileInput
            label={"Obálka"}
            accept={"image"}
            errors={fields.cover.errors}
            onChange={handleFileChange(fields.cover.name, fields.cover.dirty)}
            {...getInputProps(fields.cover, { type: "file" })}
          />
          <input {...getInputProps(fields.pdfId, { type: "hidden" })} />
          <FileInput
            label={"PDF"}
            accept={"pdf"}
            errors={fields.pdf.errors}
            onChange={handleFileChange(fields.pdf.name, fields.pdf.dirty)}
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
          <input {...getInputProps(fields.publishedAt, { type: "hidden" })} />
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
          <Button
            type="submit"
            disabled={contentStates.length === 0}
            variant={"default"}
          >
            Upravit
          </Button>
          <LinkButton to={"/administration/archive"}>Zrušit</LinkButton>
        </FormActions>
      </Form>
    </>
  )
}

export { handle } from "./_handle"
export { meta } from "./_meta"
export { loader } from "./_loader"
export { action } from "./_action"
