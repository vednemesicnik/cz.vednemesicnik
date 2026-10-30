// noinspection JSUnusedGlobalSymbols

import { useId } from 'react'
import { CoverHeader } from '~/components/cover-header'
import { CoverHeaderBody } from '~/components/cover-header-body'
import { CoverHeaderCover } from '~/components/cover-header-cover'
import { EpisodeNumber } from '~/components/episode-number'
import { Heading } from '~/components/heading'
import { Headline } from '~/components/headline'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import { ParentLink } from '~/components/parent-link'
import { Subheadline } from '~/components/subheadline'
import { getParentBreadcrumb } from '~/utils/breadcrumbs'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { ListenLinkCard } from './components/listen-link-card'

export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  matches,
}: Route.ComponentProps) {
  const { podcastEpisode } = loaderData
  const parent = getParentBreadcrumb(matches)
  const listenHeadingId = useId()

  return (
    <Page alignment={'start'}>
      <CoverHeader className={styles.header}>
        {parent && <ParentLink to={parent.path}>{parent.label}</ParentLink>}
        {podcastEpisode.cover !== null && (
          <CoverHeaderCover
            alt={podcastEpisode.cover.altText}
            image={podcastEpisode.cover.sources}
            sizes={'(width < 640px) 160px, 180px'}
          />
        )}
        <CoverHeaderBody>
          <Headline>
            {podcastEpisode.number !== null && (
              <>
                <EpisodeNumber>{podcastEpisode.number}</EpisodeNumber>{' '}
              </>
            )}
            {podcastEpisode.title}
          </Headline>
          <Subheadline>
            {podcastEpisode.publishedAt.iso ? (
              <time dateTime={podcastEpisode.publishedAt.iso}>
                {podcastEpisode.publishedAt.formatted}
              </time>
            ) : (
              podcastEpisode.publishedAt.formatted
            )}
          </Subheadline>
        </CoverHeaderBody>
      </CoverHeader>

      <Paragraph className={styles.description}>
        {podcastEpisode.description}
      </Paragraph>

      {podcastEpisode.links.length > 0 && (
        <section aria-labelledby={listenHeadingId} className={styles.listen}>
          <Heading id={listenHeadingId} level={2}>
            Kde poslouchat
          </Heading>
          <ul className={styles.links}>
            {podcastEpisode.links.map((link) => (
              <ListenLinkCard
                href={link.url}
                key={link.id}
                label={link.label}
              />
            ))}
          </ul>
        </section>
      )}
    </Page>
  )
}
