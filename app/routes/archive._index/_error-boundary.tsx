import { isRouteErrorResponse, useRouteError } from "@remix-run/react"

import { Headline } from "~/components/headline"
import { Page } from "~/components/page"
import { Paragraph } from "~/components/paragraph"

export const ErrorBoundary = () => {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <Page>
        <Headline>Archiv</Headline>
        <Paragraph>PDF soubor nebyl nalezen.</Paragraph>
        <code>
          Chyba: {error.status} - {error.statusText}
          <br />
          Detail: {error.data}
        </code>
      </Page>
    )
  } else if (error instanceof Error) {
    return (
      <Page>
        <Headline>Archiv</Headline>
        <Paragraph>Při hledání PDF souboru se něco pokazilo.</Paragraph>
        <code>
          {error.message}
          <br />
          {error.stack}
        </code>
      </Page>
    )
  } else {
    return (
      <Page>
        <Headline>Archiv</Headline>
        <Paragraph>Něco se pokazilo.</Paragraph>
      </Page>
    )
  }
}
