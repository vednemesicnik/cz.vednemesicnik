// noinspection JSUnusedGlobalSymbols

export { loader } from './_loader'
export { middleware } from './_middleware'

// Never renders: the middleware serves the PDF, otherwise the loader throws a 404.
// The default export makes this a UI route, so the 404 renders the website page
// instead of bare text.
export default function RouteComponent() {
  return null
}
