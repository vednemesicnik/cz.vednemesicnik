// noinspection JSUnusedGlobalSymbols

import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
} from "@remix-run/node"

import { addArchivedIssueAction } from "~/components/add-archived-issue-action"
import { AddArchivedIssueForm } from "~/components/add-archived-issue-form"
import { getAuthorization } from "~/utils/auth.server"

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Administrace Archivu - Přidat výtisk" }]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  return json({ status: "OK" })
}

export const action = addArchivedIssueAction

export default function AdministrationArchiveAddArchivedIssue() {
  return (
    <>
      <h1>Přidat výtisk</h1>
      <AddArchivedIssueForm />
    </>
  )
}
