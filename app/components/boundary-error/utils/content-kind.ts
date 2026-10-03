/** What a visitor was looking for when a boundary renders a 404 (design 30e, 30f). */
export type ContentKind =
  | 'article'
  | 'category'
  | 'tag'
  | 'podcast'
  | 'episode'
  | 'issue'
  | 'author'
  | 'user'

export type AdminContentKindMatch = {
  kind: ContentKind
  podcastId?: string
}

const getSegments = (pathname: string) =>
  pathname.split('/').filter((segment) => segment !== '')

/**
 * Derives the content kind from a website address (design 30f). Matches exact depth
 * only, so an address deeper than any detail route resolves to `null`.
 *
 * @param pathname - The current pathname, e.g. `/articles/some-slug`.
 * @returns The kind of the detail page the address points at, or `null`.
 */
export const getWebsiteContentKind = (pathname: string): ContentKind | null => {
  const [section, first, second, ...rest] = getSegments(pathname)

  if (rest.length > 0) return null

  if (section === 'articles') {
    if (first === 'categories' || first === 'tags') {
      if (second === undefined) return null
      return first === 'categories' ? 'category' : 'tag'
    }
    return first !== undefined && second === undefined ? 'article' : null
  }

  if (section === 'podcasts' && first !== undefined) {
    return second === undefined ? 'podcast' : 'episode'
  }

  if (section === 'archive' && first !== undefined && second === undefined) {
    return 'issue'
  }

  return null
}

const isRecordSegment = (segment: string | undefined): segment is string =>
  segment !== undefined && !segment.startsWith('add-')

const adminSectionKinds: Record<string, ContentKind> = {
  archive: 'issue',
  authors: 'author',
  users: 'user',
}

/**
 * Derives the content kind of a record from an administration address (design 30e).
 * Sub-paths of a record (`…/edit-article`) still resolve to the record.
 *
 * @param pathname - The current pathname, e.g. `/administration/articles/abc123`.
 * @returns The record kind, plus `podcastId` for an episode, or `null` when the
 *   address points at no record.
 */
export const getAdminContentKind = (
  pathname: string,
): AdminContentKindMatch | null => {
  const [root, section, first, second, third] = getSegments(pathname)

  if (root !== 'administration' || section === undefined) return null

  if (section === 'articles') {
    if (first === 'categories' || first === 'tags') {
      if (!isRecordSegment(second)) return null
      return { kind: first === 'categories' ? 'category' : 'tag' }
    }
    return isRecordSegment(first) ? { kind: 'article' } : null
  }

  if (section === 'podcasts') {
    if (!isRecordSegment(first)) return null
    if (second === 'episodes') {
      return isRecordSegment(third)
        ? { kind: 'episode', podcastId: first }
        : null
    }
    return { kind: 'podcast' }
  }

  const kind = adminSectionKinds[section]

  return kind !== undefined && isRecordSegment(first) ? { kind } : null
}
