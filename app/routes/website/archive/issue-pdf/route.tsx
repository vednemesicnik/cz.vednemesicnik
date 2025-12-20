import { isRouteErrorResponse } from 'react-router'

import { Headline } from '~/components/headline'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'

import type { Route } from './+types/route'

export { loader } from './_loader'

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <Page>
        <Headline>Naše čísla pohromadě</Headline>
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
        <Headline>Naše čísla pohromadě</Headline>
        <Paragraph>Při hledání čísel v databázi se něco pokazilo.</Paragraph>
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
        <Headline>Naše čísla pohromadě</Headline>
        <Paragraph>Něco se pokazilo.</Paragraph>
      </Page>
    )
  }
}
