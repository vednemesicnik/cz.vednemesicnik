const SITE_HOSTNAMES = new Set(['vednemesicnik.cz', 'www.vednemesicnik.cz'])

/**
 * Tells whether a link leaves the site: an absolute `http(s)` address on
 * another host. Relative paths, anchors and `mailto:`/`tel:` stay on the site.
 *
 * @param href - The link's address, as stored by the editor.
 * @returns `true` when the link points outside vednemesicnik.cz.
 */
export const isExternalHref = (href: string | null | undefined): boolean => {
  if (!href || !URL.canParse(href)) return false

  const url = new URL(href)

  return (
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    !SITE_HOSTNAMES.has(url.hostname)
  )
}
