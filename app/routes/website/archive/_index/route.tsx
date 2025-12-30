// noinspection JSUnusedGlobalSymbols
import { href, isRouteErrorResponse, Link, useSearchParams } from 'react-router'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Image } from '~/components/image'
import { LIMIT_PARAM, LoadMoreContent } from '~/components/load-more-content'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import { Tile } from '~/components/tile'
import { TileGrid } from '~/components/tile-grid'
import { TileGridItem } from '~/components/tile-grid-item'
import { sizeConfig } from '~/config/size-config'
import { getIssuePdfSrc } from '~/utils/get-issue-pdf-src'
import type { Route } from './+types/route'

export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { issues, issuesCount } = loaderData

  const [searchParams] = useSearchParams()
  const limit = Number(searchParams.get(LIMIT_PARAM))

  return (
    <Page>
      <HeadlineGroup>
        <Headline>Naše čísla pohromadě</Headline>
      </HeadlineGroup>

      <TileGrid>
        {issues.map((issue) => {
          const { id, cover, pdf, label } = issue

          if (cover === null || pdf === null) return null

          const coverAlt = cover.altText
          const coverSrc = href('/resources/issue-cover/:id', { id: cover.id })
          const pdfSrc = getIssuePdfSrc(pdf.fileName)

          return (
            <TileGridItem key={id}>
              <Link reloadDocument={true} title={label} to={pdfSrc}>
                <Tile label={label}>
                  <Image
                    alt={coverAlt}
                    height={sizeConfig.archivedIssueCover.height}
                    src={coverSrc}
                    width={sizeConfig.archivedIssueCover.width}
                  />
                </Tile>
              </Link>
            </TileGridItem>
          )
        })}
      </TileGrid>

      {issuesCount <= limit ? null : (
        <LoadMoreContent action={'/archive'} limit={limit + 20} />
      )}
    </Page>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <Page>
        <Headline>Naše čísla pohromadě</Headline>
        <Paragraph>Při hledání čísel v databázi se něco pokazilo.</Paragraph>
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
