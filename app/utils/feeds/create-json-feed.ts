import type { Feed } from './feed-types'

/**
 * Writes a feed as a JSON Feed 1.1 document.
 *
 * @param feed - The channel and its items, newest first.
 * @returns The JSON document in Czech (`language` `cs`). An item's `id` and `url`
 *   are its link, `content_text` its description or, without one, its title, and
 *   `date_published` its date in ISO 8601.
 *
 * @example
 * createJsonFeed({ channel, items: [] })
 */
export const createJsonFeed = ({ channel, items }: Feed) => {
  return JSON.stringify({
    description: channel.description,
    feed_url: channel.feedUrl,
    home_page_url: channel.link,
    items: items.map(({ title, link, description, author, publishedAt }) => ({
      ...(author ? { authors: [{ name: author }] } : {}),
      content_text: description || title,
      date_published: publishedAt.toISOString(),
      id: link,
      title,
      url: link,
    })),
    language: 'cs',
    title: channel.title,
    version: 'https://jsonfeed.org/version/1.1',
  })
}
