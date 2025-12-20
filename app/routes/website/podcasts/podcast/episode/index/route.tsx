// noinspection JSUnusedGlobalSymbols

import { Headline } from "~/components/headline"
import { Hyperlink } from "~/components/hyperlink"
import { List } from "~/components/list"
import { ListItem } from "~/components/list-item"
import { Paragraph } from "~/components/paragraph"
import { Subheadline } from "~/components/subheadline"
import { getFormattedPublishDate } from "~/utils/get-formatted-publish-date"

import type { Route } from "./+types/route"

export default function Route({ loaderData }: Route.ComponentProps) {
  const formattedPublishDate = getFormattedPublishDate(
    loaderData.episode.publishedAt
  )

  return (
    <>
      <Headline marginBottom={false}>{loaderData.episode.title}</Headline>
      <Subheadline marginTop={true} marginBottom={true}>
        {formattedPublishDate}
      </Subheadline>
      <Paragraph>{loaderData.episode.description}</Paragraph>
      <List>
        {loaderData.episode.links.map((link) => (
          <ListItem key={link.id}>
            <Hyperlink href={link.url}>{link.label}</Hyperlink>
          </ListItem>
        ))}
      </List>
    </>
  )
}

export { meta } from "./_meta"
export { loader } from "./_loader"
