// noinspection JSUnusedGlobalSymbols

import { type MetaFunction } from "@remix-run/node"

import { Headline } from "app/components/headline"
import { Page } from "~/components/page"

export default function Articles() {
  return (
    <Page>
      <Headline>Články</Headline>
      <p>Zde budou články.</p>
    </Page>
  )
}

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Články" }]
}
