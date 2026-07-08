import type { Route } from './+types/route'

// Loader headers are not sent to document responses automatically — they must
// be forwarded from a `headers` export. This preserves the loader's
// `Cache-Control: no-store`, which keeps the enrollment secret and QR code from
// being cached. (`Set-Cookie` is preserved by React Router regardless.)
export const headers = ({ loaderHeaders }: Route.HeadersArgs) => loaderHeaders
