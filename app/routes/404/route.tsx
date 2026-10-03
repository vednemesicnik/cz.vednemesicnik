// noinspection JSUnusedGlobalSymbols

export { loader } from './_loader'

// Never renders: the loader always throws a 404, which the website layout boundary
// renders as the generic page (design 30f). The default export makes this a UI route.
export default function RouteComponent() {
  return null
}
