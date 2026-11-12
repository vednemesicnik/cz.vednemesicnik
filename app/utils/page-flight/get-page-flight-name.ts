type Subject = 'article-image' | 'podcast-cover' | 'episode-cover'

/**
 * The view transition name an image shares between a list and the page the
 * list opens (design 18a–18c, u6r1pxsx), e.g. `article-image-<id>`. One name
 * per record, so two images on a page never share one: a name taken twice
 * would cancel the whole transition.
 *
 * @param subject - Whose image it is.
 * @param id - The record's id, a cuid, which is a valid CSS name as it is.
 */
export const getPageFlightName = (subject: Subject, id: string) =>
  `${subject}-${id}`
