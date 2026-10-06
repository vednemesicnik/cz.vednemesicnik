/**
 * Escapes a string for use as XML text content or an attribute value.
 *
 * Replaces the five characters XML reserves (`&`, `<`, `>`, `"`, `'`) with their
 * predefined entities. `&` goes first so the entities added afterwards are not
 * escaped a second time.
 *
 * @param value - Raw text to embed in an XML document.
 * @returns The text with every reserved character replaced by its entity.
 *
 * @example
 * escapeXml('Tom & Jerry <3') // "Tom &amp; Jerry &lt;3"
 */
export const escapeXml = (value: string) => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
