// noinspection JSUnusedGlobalSymbols

import type { MetaFunction } from "@remix-run/node"
import { Page } from "~/components/page"

export default function Index() {
  return (
    <Page>
      <h1>Hlavní stránka</h1>
    </Page>
  )
}

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník" }, { name: "description", content: "Studentské nekritické noviny" }]
}
