// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'

import { AuthenticityTokenProvider } from '~/components/authenticity-token-provider'
import { ClearFiltersLink } from '~/components/clear-filters-link'
import { FilterBarFilters } from '~/components/filter-bar-filters'
import { FilterBarGroup } from '~/components/filter-bar-group'
import { FilterBarSearch } from '~/components/filter-bar-search'
import { FilterMenu } from '~/components/filter-menu'
import { SavedFiltersMenu } from '~/components/saved-filters-menu'
import { SavedFiltersTrigger } from '~/components/saved-filters-trigger'

import { FilterBar } from './_component'

const meta: Meta<typeof FilterBar> = {
  component: FilterBar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/FilterBar',
}

export default meta
type Story = StoryObj<typeof meta>

// The parts navigate and submit; a data router keeps them close to the app.
const withRouterAt = (search: string, children: ReactElement) => {
  const router = createMemoryRouter(
    [{ element: children, path: '/administration/articles/categories' }],
    {
      initialEntries: [
        { pathname: '/administration/articles/categories', search },
      ],
    },
  )

  return (
    <AuthenticityTokenProvider token={'story'}>
      <RouterProvider router={router} />
    </AuthenticityTokenProvider>
  )
}

const STATE_OPTIONS = [
  { count: 2, label: 'Koncepty', value: 'draft' },
  { attention: true, count: 1, label: 'Ke schválení', value: 'pending' },
  { count: 0, label: 'Schválené', value: 'approved' },
  { label: 'Publikované', value: 'published' },
  { label: 'Archivované', value: 'archived' },
]

/** A list with Stav and saved filters (25a): Ke schválení selected. */
export const Playground: Story = {
  render: () =>
    withRouterAt(
      '?state=pending',
      <FilterBar>
        <FilterBarGroup>
          <FilterBarSearch
            defaultValue={''}
            placeholder={'Název nebo adresa'}
          />
          <FilterBarFilters>
            <FilterMenu
              attention={{
                count: 1,
                description: 'na schválení čeká celkem 1 rubrika',
              }}
              clearLabel={'Vše'}
              label={'Stav'}
              name={'state'}
              options={STATE_OPTIONS}
              selectedValues={['pending']}
            />
            <ClearFiltersLink />
            <SavedFiltersTrigger
              matchingFilterName={undefined}
              placement={'filters'}
            />
          </FilterBarFilters>
        </FilterBarGroup>
        <SavedFiltersMenu
          currentQuery={'state=pending'}
          defaultHint={
            'Použije se při otevření seznamu rubrik, pokud odkaz neobsahuje vlastní nastavení seznamu.'
          }
          matchingFilterId={null}
          matchingFilterName={undefined}
          ownFilters={[]}
          sharedFilters={[]}
          summaryLines={['Stav: Ke schválení']}
          tableKey={'article_categories'}
        />
      </FilterBar>,
    ),
}

/** Only the search (28d): no filters to save or clear. */
export const SearchOnly: Story = {
  render: () =>
    withRouterAt(
      '',
      <FilterBar>
        <FilterBarGroup>
          <FilterBarSearch
            defaultValue={''}
            placeholder={'Jméno nebo e-mail'}
          />
        </FilterBarGroup>
      </FilterBar>,
    ),
}
