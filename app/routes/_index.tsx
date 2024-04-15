// noinspection JSUnusedGlobalSymbols

import type { MetaFunction } from "@remix-run/node"

import { Page } from "~/components/page"
import { PageHeading } from "app/components/page-heading"

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník" }, { name: "description", content: "Studentské nekritické noviny" }]
}

export default function Index() {
  return (
    <Page>
      <PageHeading>Hlavní stránka</PageHeading>
    </Page>
  )
}
