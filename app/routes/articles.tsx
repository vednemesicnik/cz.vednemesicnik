// noinspection JSUnusedGlobalSymbols

import type { MetaFunction } from "@remix-run/node"

import { Page } from "~/components/page"
import { PageHeading } from "app/components/page-heading"

export default function Articles() {
  return (
    <Page>
      <PageHeading>Články</PageHeading>
    </Page>
  )
}

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Články" }]
}
