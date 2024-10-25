import { useLoaderData } from "@remix-run/react"

import { Headline } from "~/components/headline"
import { Hyperlink } from "~/components/hyperlink"
import { List } from "~/components/list"
import { ListItem } from "~/components/list-item"
import { Page } from "~/components/page"
import { Paragraph } from "~/components/paragraph"

import { type loader } from "./_loader"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()

  return (
    <Page>
      <Headline>{loaderData.episode.title}</Headline>
      <Paragraph>{loaderData.episode.description}</Paragraph>
      <List>
        {loaderData.episode.links.map((link) => (
          <ListItem key={link.id}>
            <Hyperlink to={link.url}>{link.label}</Hyperlink>
          </ListItem>
        ))}
      </List>
    </Page>
  )
}

export { meta } from "./_meta"
export { loader } from "./_loader"
