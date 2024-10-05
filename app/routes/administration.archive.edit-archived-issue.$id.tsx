// noinspection JSUnusedGlobalSymbols

import { type MetaFunction } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"

import { editArchivedIssueAction } from "~/components/edit-archived-issue-action"
import { EditArchivedIssueForm } from "~/components/edit-archived-issue-form"
import { editArchivedIssueLoader } from "~/components/edit-archived-issue-loader"

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Administrace Archivu - Upravit výtisk" }]
}

export const loader = editArchivedIssueLoader

export default function AdministrationArchiveEditArchivedIssue() {
  const data = useLoaderData<typeof loader>()

  const id = data.archivedIssue.id
  const publishedAt = data.archivedIssue.publishedAt?.split("T")[0] ?? ""
  const published = data.archivedIssue.published
  const ordinalNumber = data.archivedIssue.label.split("/")[0]
  const coverId = data.archivedIssue.cover?.id
  const pdfId = data.archivedIssue.pdf?.id

  return (
    <>
      <h1>Upravit výtisk</h1>
      <EditArchivedIssueForm
        id={id}
        ordinalNumber={ordinalNumber}
        publishedAt={publishedAt}
        published={published}
        coverId={coverId}
        pdfId={pdfId}
      />
    </>
  )
}

export const action = editArchivedIssueAction
