import { escapeXml } from '~/utils/escape-xml'

import type { Feed, FeedItem } from './feed-types'

const createElement = (name: string, value: string) =>
  `<${name}>${escapeXml(value)}</${name}>`

const createItem = ({
  title,
  link,
  description,
  author,
  publishedAt,
}: FeedItem) =>
  [
    '    <item>',
    `      ${createElement('title', title)}`,
    `      ${createElement('link', link)}`,
    `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
    description ? `      ${createElement('description', description)}` : null,
    // RSS's own <author> wants an e-mail address; a name goes to dc:creator.
    author ? `      ${createElement('dc:creator', author)}` : null,
    `      ${createElement('pubDate', publishedAt.toUTCString())}`,
    '    </item>',
  ]
    .filter((line) => line !== null)
    .join('\n')

/**
 * Writes a feed as an RSS 2.0 document.
 *
 * @param feed - The channel and its items, newest first.
 * @returns The XML document in Czech (`language` `cs`), every text escaped. The
 *   channel's `lastBuildDate` is the newest item's date and is left out without
 *   items; `atom:link` names the feed's own address, as readers expect.
 *
 * @example
 * createRssFeed({ channel, items: [] })
 */
export const createRssFeed = ({ channel, items }: Feed) => {
  const newestDate = items.reduce<Date | null>(
    (newest, { publishedAt }) =>
      newest === null || publishedAt > newest ? publishedAt : newest,
    null,
  )

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '  <channel>',
    `    ${createElement('title', channel.title)}`,
    `    ${createElement('link', channel.link)}`,
    `    ${createElement('description', channel.description)}`,
    `    <atom:link href="${escapeXml(channel.feedUrl)}" rel="self" type="application/rss+xml"/>`,
    '    <language>cs</language>',
    newestDate === null
      ? null
      : `    ${createElement('lastBuildDate', newestDate.toUTCString())}`,
    ...items.map(createItem),
    '  </channel>',
    '</rss>',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n')
}
