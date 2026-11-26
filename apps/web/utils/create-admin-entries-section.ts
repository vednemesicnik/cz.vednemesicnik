import {
  index,
  layout,
  prefix,
  type RouteConfigEntry,
  route,
} from '@react-router/dev/routes'

type Args = {
  name: string
  entry: string
  path: string
  id: string
}

export const createAdminEntriesSection = (
  { name, entry, path, id }: Args,
  ...additionalRouteConfigEntries: RouteConfigEntry[]
) => [
  ...prefix(name, [
    // Section layout
    layout(`${path}/__layout/route.tsx`, [
      // List
      index(`${path}/_index/route.tsx`),
      // Add entry
      route(`add-${entry}`, `${path}/add-${entry}/route.tsx`),
      // Entry
      ...prefix(`:${id}`, [
        // Entry layout
        layout(`${path}/${entry}/__layout/route.tsx`, [
          // Details
          index(`${path}/${entry}/_index/route.tsx`),
          // Edit entry
          route(`edit-${entry}`, `${path}/${entry}/edit-${entry}/route.tsx`),

          ...additionalRouteConfigEntries,
        ]),
      ]),
    ]),
  ]),
]
