// noinspection JSUnusedGlobalSymbols

import { json, type LoaderFunctionArgs, type MetaFunction, redirect } from "@remix-run/node"

import { addArchivedIssueAction } from "~/components/add-archived-issue-action"
import { AddArchivedIssueForm } from "~/components/add-archived-issue-form"
import { Page } from "~/components/page"
import { getAuthSession } from "~/utils/auth.server"

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Archiv - Přidat výtisk" }]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const authSession = await getAuthSession(request)
  const userId = authSession.get("userId")

  if (userId === undefined) {
    throw redirect("/administration/signin")
  }

  return json({ status: "OK" })
}

export const action = addArchivedIssueAction

export default function AdministrationArchiveAddArchivedIssue() {
  return (
    <Page>
      <h1>Přidat výtisk</h1>
      <AddArchivedIssueForm />
    </Page>
  )
}
