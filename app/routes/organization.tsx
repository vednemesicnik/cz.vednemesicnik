// noinspection JSUnusedGlobalSymbols

import type { MetaFunction } from "@remix-run/node"
import { Page } from "~/components/page"

export default function Organization() {
  return (
    <Page>
      <h1>Spolek</h1>
    </Page>
  )
}

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Spolek" }]
}
