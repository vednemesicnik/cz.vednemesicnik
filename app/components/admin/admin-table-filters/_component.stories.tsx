// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'

import { AdminFilterSelect } from '~/components/admin/admin-filter-select'
import { contentStateConfig } from '~/config/content-state-config'
import { getPreservedFilterParams } from '~/utils/admin-list-filters'

import { AdminTableFilters } from './_component'

const meta: Meta<typeof AdminTableFilters> = {
  component: AdminTableFilters,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Administration/AdminTableFilters',
}

export default meta
type Story = StoryObj<typeof meta>

const stateOptions = contentStateConfig.states.map((state) => ({
  label: contentStateConfig.selectMap[state],
  value: state,
}))

// `<Form>` needs a data router, so `MemoryRouter` is not enough here.
const withRouterAt = (search: string, children: ReactElement) => {
  const router = createMemoryRouter(
    [{ element: children, path: '/administration/articles' }],
    { initialEntries: [{ pathname: '/administration/articles', search }] },
  )

  return <RouterProvider router={router} />
}

/**
 * No other params in the URL, so no hidden inputs are rendered. The "Filtrovat"
 * button is in the DOM but hidden — with scripting available the selects submit
 * on change, so it only shows as the no-JS fallback.
 */
export const Playground: Story = {
  render: () =>
    withRouterAt(
      '',
      <AdminTableFilters preservedParams={[]}>
        <AdminFilterSelect
          label={'Stav'}
          name={'state'}
          options={stateOptions}
        />
      </AdminTableFilters>,
    ),
}

/**
 * Search and sort are in the URL, so they are carried as hidden inputs; `page` is
 * dropped because changing a filter resets pagination.
 */
export const WithPreservedParams: Story = {
  render: () =>
    withRouterAt(
      '?q=redakce&sort=title&order=asc&page=3',
      <AdminTableFilters
        preservedParams={getPreservedFilterParams(
          new URLSearchParams('?q=redakce&sort=title&order=asc&page=3'),
          'articles',
        )}
      >
        <AdminFilterSelect
          defaultValue={'draft'}
          label={'Stav'}
          name={'state'}
          options={stateOptions}
        />
      </AdminTableFilters>,
    ),
}
