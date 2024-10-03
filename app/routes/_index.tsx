// noinspection JSUnusedGlobalSymbols

import { type MetaFunction } from "@remix-run/node"

import { Headline } from "app/components/headline"
import { Page } from "~/components/page"

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník" }, { name: "description", content: "Studentské nekritické noviny" }]
}

export default function Index() {
  return (
    <Page>
      <Headline>Hlavní stránka</Headline>
    </Page>
  )
}
