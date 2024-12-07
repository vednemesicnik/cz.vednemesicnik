// noinspection JSUnusedGlobalSymbols

import { Link, useSearchParams } from "react-router"

import { Headline } from "~/components/headline"
import { LIMIT_PARAM, LoadMoreContent } from "~/components/load-more-content"
import { Page } from "~/components/page"
import { Tile } from "~/components/tile"
import { TileGrid } from "~/components/tile-grid"
import { TileGridItem } from "~/components/tile-grid-item"
import { sizeConfig } from "~/config/size-config"
import { getIssueCoverSrc } from "~/utils/get-issue-cover-src"
import { getIssuePdfSrc } from "~/utils/get-issue-pdf-src"

import type { Route } from "./+types/route"

export default function Archive({ loaderData }: Route.ComponentProps) {
  const { archivedIssues } = loaderData

  const [searchParams] = useSearchParams()
  const limit = Number(searchParams.get(LIMIT_PARAM))

  // throw new Error("Component error: Archive component is not implemented yet.")

  return (
    <Page>
      <Headline>Naše čísla pohromadě</Headline>

      <TileGrid>
        {archivedIssues.map((issue) => {
          const { id, cover, pdf, label } = issue

          if (cover === null || pdf === null) return null

          const coverAlt = cover.altText
          const coverSrc = getIssueCoverSrc(cover.id)
          const pdfSrc = getIssuePdfSrc(pdf.fileName)

          return (
            <TileGridItem key={id}>
              <Link to={pdfSrc} title={label} reloadDocument={true}>
                <Tile
                  label={label}
                  src={coverSrc}
                  alt={coverAlt}
                  width={sizeConfig.archivedIssueCover.width}
                  height={sizeConfig.archivedIssueCover.height}
                  placeholderWidth={
                    sizeConfig.archivedIssueCover.placeholderWidth
                  }
                  placeholderHeight={
                    sizeConfig.archivedIssueCover.placeholderHeight
                  }
                />
              </Link>
            </TileGridItem>
          )
        })}
      </TileGrid>

      {archivedIssues.length < limit ? null : (
        <LoadMoreContent limit={limit + 20} action={"/archive"} />
      )}
    </Page>
  )
}

export { meta } from "./_meta"
export { loader } from "./_loader"
export { ErrorBoundary } from "./_error-boundary"
