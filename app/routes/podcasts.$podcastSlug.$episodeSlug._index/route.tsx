import { useLoaderData } from "@remix-run/react"

import { Headline } from "~/components/headline"
import { Hyperlink } from "~/components/hyperlink"
import { List } from "~/components/list"
import { ListItem } from "~/components/list-item"
import { Paragraph } from "~/components/paragraph"
import { Subheadline } from "~/components/subheadline"
import { getFormattedPublishDate } from "~/utils/get-formatted-publish-date"

import { type loader } from "./_loader"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()
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
            <Hyperlink to={link.url}>{link.label}</Hyperlink>
          </ListItem>
        ))}
      </List>
    </>
  )
}

export { meta } from "./_meta"
export { loader } from "./_loader"
