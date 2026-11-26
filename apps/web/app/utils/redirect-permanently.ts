import { redirect } from 'react-router'

/**
 * A permanent redirect from an old address that keeps its query (design 30b).
 *
 * @param url - The request's normalized URL (the loader's `url`, never
 *   `request.url`, which carries the `.data` suffix of a Single Fetch).
 * @param pathname - The new address.
 * @returns A 301 response to throw from the loader.
 */
export const redirectPermanently = (url: URL, pathname: string) =>
  redirect(`${pathname}${url.search}`, 301)
