import type { Route } from './+types/route'

// Forwards the loader's `Cache-Control: no-store` and `Referrer-Policy:
// no-referrer` to the document, which carries the single-use token.
export const headers = ({ loaderHeaders }: Route.HeadersArgs) => loaderHeaders
