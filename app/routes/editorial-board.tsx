// noinspection JSUnusedGlobalSymbols

import type { MetaFunction } from "@remix-run/node"
import { Page } from "~/components/page"

export default function EditorialBoard() {
  return (
    <Page>
      <h1>Redakce</h1>
    </Page>
  )
}

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Redakce" }]
}
