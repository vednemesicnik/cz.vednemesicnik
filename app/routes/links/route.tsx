// noinspection JSUnusedGlobalSymbols

import type { ComponentProps } from "react"
import { href } from "react-router"

import { SocialSites } from "~/components/social-sites"
import { getIssueCoverSrc } from "~/utils/get-issue-cover-src"
import { getPodcastCoverSrc } from "~/utils/get-podcast-cover-src"
import { getPodcastEpisodeCoverSrc } from "~/utils/get-podcast-episode-cover-src"

import type { Route } from "./+types/route"
import { Content } from "./components/content"
import { Footer } from "./components/footer"
import { GraphicLink } from "./components/graphic-link"
import { Header } from "./components/header"
import { Heading } from "./components/heading"
import { LinkGroup } from "./components/link-group"
import { LinkGroupItem } from "./components/link-group-item"
import { SimpleHyperlink } from "./components/simple-hyperlink"
import { SimpleLink } from "./components/simple-link"
import { Subheading } from "./components/subheading"
import { VdmLogoClip } from "./components/vdm-logo-clip"

import "./styles/global.css"

export { links } from "./_links"
export { loader } from "./_loader"
export { meta } from "./_meta"

type GraphicLinkImage = ComponentProps<typeof GraphicLink>["image"]

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { latestIssue, latestPodcastEpisode } = loaderData

  const latestIssueCoverImage: GraphicLinkImage =
    latestIssue !== null && latestIssue.cover !== null
      ? {
          src: getIssueCoverSrc(latestIssue.cover.id),
          width: 50,
          height: 70,
        }
      : undefined

  const latestEpisodeCoverImage: GraphicLinkImage =
    latestPodcastEpisode !== null && latestPodcastEpisode.cover !== null
      ? {
          src: getPodcastEpisodeCoverSrc(latestPodcastEpisode.cover.id),
          width: 50,
          height: 50,
        }
      : latestPodcastEpisode !== null &&
          latestPodcastEpisode.podcast.cover !== null
        ? {
            src: getPodcastCoverSrc(latestPodcastEpisode.podcast.cover.id),
            width: 50,
            height: 50,
          }
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
                to={href("/podcasts/:podcastSlug/:episodeSlug", {
                  podcastSlug: latestPodcastEpisode.podcast.slug,
                  episodeSlug: latestPodcastEpisode.slug,
                })}
                image={latestEpisodeCoverImage}
              >
                Nový díl 🎙🌸
              </GraphicLink>
            </LinkGroupItem>
          )}
          {latestIssue !== null && latestIssue.pdf !== null && (
            <LinkGroupItem>
              <GraphicLink
                to={href("/archive/:fileName", {
                  fileName: latestIssue.pdf.fileName,
                })}
                image={latestIssueCoverImage}
              >
                Nové číslo 📰✨
              </GraphicLink>
            </LinkGroupItem>
          )}
          <LinkGroupItem>
            <SimpleHyperlink href={"https://medium.com/vednemesicnik"}>
              Web s články 👀🥰
            </SimpleHyperlink>
          </LinkGroupItem>
          <LinkGroupItem>
            <SimpleLink to={href("/archive")}>VDM archiv ❤️</SimpleLink>
          </LinkGroupItem>
        </LinkGroup>
      </Content>
      <Footer>
        <SocialSites />
      </Footer>
    </>
  )
}
