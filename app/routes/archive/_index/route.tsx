// noinspection JSUnusedGlobalSymbols

import { href, isRouteErrorResponse, Link, useSearchParams } from 'react-router'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Image } from '~/components/image'
import { LoadMoreContent } from '~/components/load-more-content'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import { Tile } from '~/components/tile'
import { TileGrid } from '~/components/tile-grid'
import { TileGridItem } from '~/components/tile-grid-item'
import { LIMIT_PARAM, LIMIT_STEP } from '~/config/load-more-config'
import { sizeConfig } from '~/config/size-config'
import { getRevealProps } from '~/utils/get-reveal-props'
import { useRevealBatchStart } from '~/utils/use-reveal-batch-start'
import type { Route } from './+types/route'

export { loader } from './_loader'
export { meta } from './_meta'

type Issue = Route.ComponentProps['loaderData']['issues'][number]
type RenderableIssue = Issue & {
  cover: NonNullable<Issue['cover']>
  pdf: NonNullable<Issue['pdf']>
}

const isRenderable = (issue: Issue): issue is RenderableIssue =>
  issue.cover !== null && issue.pdf !== null

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { issues, issuesCount } = loaderData

  const [searchParams] = useSearchParams()
  const limit = Number(searchParams.get(LIMIT_PARAM) ?? String(LIMIT_STEP))
  const revealBatchStart = useRevealBatchStart(limit)

  // Filtered up front: the reveal chain and the cover priority below are keyed
  // to the position in the grid, which an issue skipped mid-map would shift.
  const renderableIssues = issues.filter(isRenderable)

  return (
    <Page>
      <HeadlineGroup>
        <Headline>Naše čísla pohromadě</Headline>
      </HeadlineGroup>

      <TileGrid>
        {renderableIssues.map((issue, index) => {
          const { id, cover, pdf, label } = issue

          const isLcpCandidate = index === 0
          const coverAlt = cover.altText
          const pdfSrc = href('/archive/:fileName', { fileName: pdf.fileName })

          return (
            <TileGridItem
              key={id}
              {...getRevealProps(index - revealBatchStart)}
            >
              <Link reloadDocument={true} title={label} to={pdfSrc}>
                <Tile label={label}>
                  <Image
                    {...cover.sources}
                    alt={coverAlt}
                    // All covers render at the same size, so the first one is
                    // the LCP candidate: it must not be lazy, and it is the
                    // only image worth boosting — more `high` would dilute it.
                    // The rest stay at the browser's own priority; `low` is for
                    // above-the-fold images that are not visible.
                    fetchPriority={isLcpCandidate ? 'high' : 'auto'}
                    loading={isLcpCandidate ? 'eager' : 'lazy'}
                    sizes={`${sizeConfig.archivedIssueCover.width}px`}
                  />
                </Tile>
              </Link>
            </TileGridItem>
          )
        })}
      </TileGrid>

      {issuesCount <= limit ? null : (
        <LoadMoreContent action={'/archive'} limit={limit + LIMIT_STEP} />
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
