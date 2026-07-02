// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { SocialSites } from '~/components/social-sites'
import type { Route } from './+types/route'
import { Content } from './components/content'
import { Footer } from './components/footer'
import { GraphicLink } from './components/graphic-link'
import { Header } from './components/header'
import { Heading } from './components/heading'
import { LinkGroup } from './components/link-group'
import { LinkGroupItem } from './components/link-group-item'
import { SimpleHyperlink } from './components/simple-hyperlink'
import { SimpleLink } from './components/simple-link'
import { Subheading } from './components/subheading'
import { VdmLogoClip } from './components/vdm-logo-clip'
import './styles/global.css'

export { links } from './_links'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { latestIssue, latestPodcastEpisode } = loaderData

  const latestIssueCoverImage = latestIssue?.coverSources.src
    ? latestIssue.coverSources
    : undefined

  // Prefer the episode's own cover, fall back to the podcast cover.
  const latestEpisodeCoverImage = latestPodcastEpisode?.coverSources.src
    ? latestPodcastEpisode.coverSources
    : latestPodcastEpisode?.podcastCoverSources.src
      ? latestPodcastEpisode.podcastCoverSources
      : undefined

  return (
    <>
      <Header logo={<VdmLogoClip />}>
        <Heading>Vedneměsíčník</Heading>
        <Subheading>Jsme studentské nekritické noviny!</Subheading>
      </Header>
      <Content>
        <LinkGroup>
          {latestPodcastEpisode !== null && (
            <LinkGroupItem>
              <GraphicLink
                image={latestEpisodeCoverImage}
                to={href('/podcasts/:podcastSlug/:episodeSlug', {
                  episodeSlug: latestPodcastEpisode.slug,
                  podcastSlug: latestPodcastEpisode.podcast.slug,
                })}
              >
                Nový díl 🎙🌸
              </GraphicLink>
            </LinkGroupItem>
          )}
          {latestIssue !== null && latestIssue.pdf !== null && (
            <LinkGroupItem>
              <GraphicLink
                image={latestIssueCoverImage}
                to={href('/archive/:fileName', {
                  fileName: latestIssue.pdf.fileName,
                })}
              >
                Nové číslo 📰✨
              </GraphicLink>
            </LinkGroupItem>
          )}
          <LinkGroupItem>
            <SimpleHyperlink href={'https://medium.com/vednemesicnik'}>
              Web s články 👀🥰
            </SimpleHyperlink>
          </LinkGroupItem>
          <LinkGroupItem>
            <SimpleLink to={href('/archive')}>VDM archiv ❤️</SimpleLink>
          </LinkGroupItem>
        </LinkGroup>
      </Content>
      <Footer>
        <SocialSites />
      </Footer>
    </>
  )
}
