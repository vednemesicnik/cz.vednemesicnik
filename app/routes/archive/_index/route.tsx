// noinspection JSUnusedGlobalSymbols

import { useMemo } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '~/components/empty-state'
import { Heading } from '~/components/heading'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Image } from '~/components/image'
import { NavRow } from '~/components/nav-row'
import { NavRowItem } from '~/components/nav-row-item'
import { Page } from '~/components/page'
import { Tile } from '~/components/tile'
import { TileCaption } from '~/components/tile-caption'
import { TileCard } from '~/components/tile-card'
import { TileFallback } from '~/components/tile-fallback'
import { TileGrid } from '~/components/tile-grid'
import { TileGridItem } from '~/components/tile-grid-item'
import { TileSublabel } from '~/components/tile-sublabel'
import { sizeConfig } from '~/config/size-config'
import { getRevealProps } from '~/utils/get-reveal-props'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { useCurrentYear } from './utils/use-current-year'

export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { years } = loaderData
  const yearNumbers = useMemo(() => years.map(({ year }) => year), [years])
  const currentYear = useCurrentYear(yearNumbers)

  // The reveal chain and the cover priority follow the tile's place on the
  // whole page, not within its year.
  let pageIndex = -1

  return (
    <Page>
      <HeadlineGroup
        className={years.length > 0 ? styles.headlineGroup : undefined}
      >
        <Headline>Naše tištěná čísla pohromadě</Headline>
      </HeadlineGroup>

      {years.length > 0 && (
        // Outside the headline group: a sticky element sticks only within
        // its parent, and the page holds every year.
        <div className={styles.yearBar}>
          <NavRow accessibleLabel={'Roky v archivu'} label={'Roky'}>
            {years.map(({ year }) => (
              <NavRowItem
                isCurrent={year === currentYear}
                key={year}
                to={`#${year}`}
              >
                {String(year)}
              </NavRowItem>
            ))}
          </NavRow>
        </div>
      )}

      {years.length === 0 && (
        <EmptyState>V archivu zatím žádné číslo není.</EmptyState>
      )}

      {years.map(({ year, issues }) => (
        <section className={styles.year} key={year}>
          <Heading className={styles.yearHeading} id={String(year)} level={2}>
            {year}
          </Heading>

          <TileGrid className={styles.grid}>
            {issues.map((issue) => {
              const { id, cover, label, linkLabel, pdfPath, sublabel } = issue

              pageIndex += 1
              const isLcpCandidate = pageIndex === 0

              return (
                <TileGridItem key={id} {...getRevealProps(pageIndex)}>
                  <Link
                    aria-label={linkLabel}
                    reloadDocument={true}
                    to={pdfPath}
                  >
                    <Tile>
                      <TileCard ratio={'cover'}>
                        {cover ? (
                          <Image
                            {...cover.sources}
                            alt={cover.altText}
                            // All covers render at the same size, so the first
                            // one is the LCP candidate: it must not be lazy, and
                            // it is the only image worth boosting — more `high`
                            // would dilute it. The rest stay at the browser's
                            // own priority.
                            fetchPriority={isLcpCandidate ? 'high' : 'auto'}
                            loading={isLcpCandidate ? 'eager' : 'lazy'}
                            sizes={`${sizeConfig.archivedIssueCover.width}px`}
                          />
                        ) : (
                          <TileFallback>{label}</TileFallback>
                        )}
                      </TileCard>
                      <TileCaption>
                        {label}
                        {sublabel !== null && (
                          <TileSublabel>{sublabel}</TileSublabel>
                        )}
                      </TileCaption>
                    </Tile>
                  </Link>
                </TileGridItem>
              )
            })}
          </TileGrid>
        </section>
      ))}
    </Page>
  )
}
