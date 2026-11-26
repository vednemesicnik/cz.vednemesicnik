import {
  index,
  layout,
  prefix,
  type RouteConfigEntry,
} from '@react-router/dev/routes'

type Args = {
  name: string
  path: string
}

export const createAdminIntersection = (
  { name, path }: Args,
  ...additionalRouteConfigEntries: RouteConfigEntry[]
) => {
  return [
    ...prefix(name, [
      // Intersection layout
      layout(`${path}/__layout/route.tsx`, [
        // Intersection
        index(`${path}/_index/route.tsx`),

        ...additionalRouteConfigEntries,
      ]),
    ]),
  ]
}
