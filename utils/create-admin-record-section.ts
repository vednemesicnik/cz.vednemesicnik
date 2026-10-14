import { layout, prefix, route } from '@react-router/dev/routes'

type Args = {
  name: string
  entry: string
  path: string
  id: string
}

/**
 * Routes of a "Záznam" section (design 30a): the add dialog is `new`, a child of
 * the list, and the edit dialog is `edit`, a child of the detail, so each renders
 * its parent with the dialog over it. The old `add-<entry>` and
 * `edit-<entry>` addresses stay as redirects (30b).
 *
 * @param args.name - The section's path segment, e.g. `categories`.
 * @param args.entry - The record's name, e.g. `category`.
 * @param args.path - The section's route directory.
 * @param args.id - The record's id parameter, e.g. `categoryId`.
 */
export const createAdminRecordSection = ({ name, entry, path, id }: Args) => [
  ...prefix(name, [
    layout(`${path}/__layout/route.tsx`, [
      route('', `${path}/_index/route.tsx`, [
        route('new', `${path}/new/route.tsx`),
      ]),
      route(`add-${entry}`, `${path}/add-${entry}/route.ts`),
      ...prefix(`:${id}`, [
        layout(`${path}/${entry}/__layout/route.tsx`, [
          route('', `${path}/${entry}/_index/route.tsx`, [
            route('edit', `${path}/${entry}/edit/route.tsx`),
          ]),
          route(`edit-${entry}`, `${path}/${entry}/edit-${entry}/route.ts`),
        ]),
      ]),
    ]),
  ]),
]
