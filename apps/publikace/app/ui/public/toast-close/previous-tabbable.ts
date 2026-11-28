const FOCUSABLE =
  'a[href], area[href], button, input, select, textarea, iframe, summary, [contenteditable], [tabindex]'

/**
 * The element Tab reaches last before `target`: what Shift+Tab from `target` would focus, as long
 * as nobody reorders the page with a positive `tabindex`, which this app never does. Disabled,
 * `inert` and unrendered elements are skipped, a closed `<details>` and a closed `<dialog>`
 * included.
 */
export function previousTabbable(target: Element): HTMLElement | null {
  let candidates = target.ownerDocument.querySelectorAll<HTMLElement>(FOCUSABLE)
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    let candidate = candidates[index]
    if (candidate === undefined || target.contains(candidate)) continue
    let isBefore =
      (candidate.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    if (isBefore && isTabbable(candidate)) return candidate
  }
  return null
}

function isTabbable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false
  if ('disabled' in element && element.disabled === true) return false
  if (element.closest('[inert]') !== null) return false
  return element.checkVisibility({ visibilityProperty: true })
}
