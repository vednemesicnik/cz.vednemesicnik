import type { Handle } from 'remix/component'
import { getContext } from 'remix/middleware/async-context'
import { getCsrfToken } from 'remix/middleware/csrf'

/**
 * The hidden field that proves a form was sent from a page this app drew. Every
 * `<form method="post">` carries one; without it `csrf()` refuses the request.
 *
 * It reads the token from the request rather than taking it as a prop, so a component that
 * draws a form on somebody else's behalf — the panel's _Odhlásit se_, a menu item — needs no
 * token threaded down to it. `asyncContext()` makes the request reachable while the page is
 * drawn; drawn outside a request, `getContext()` throws rather than writing an empty token.
 */
export function CsrfField(_handle: Handle) {
  return () => <input name="_csrf" type="hidden" value={getCsrfToken(getContext())} />
}
