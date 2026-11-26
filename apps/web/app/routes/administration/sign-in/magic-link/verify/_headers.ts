import type { Route } from './+types/route'

// Loader headers are not sent to document responses automatically — they must
// be forwarded from a `headers` export. This preserves the loader's
// `Referrer-Policy: no-referrer` and `Cache-Control: no-store`, which keep the
// single-use sign-in token in the URL from leaking or being cached.
export const headers = ({ loaderHeaders }: Route.HeadersArgs) => loaderHeaders
