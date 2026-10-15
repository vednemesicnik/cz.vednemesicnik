// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { createMemoryRouter, RouterProvider } from 'react-router'

import { ClearFiltersButton } from '~/components/clear-filters-button'
import { ListEmptyCardText } from '~/components/list-empty-card-text'
import { ListEmptyCardTitle } from '~/components/list-empty-card-title'

import { ListEmptyCard } from './_component'

const meta: Meta<typeof ListEmptyCard> = {
  component: ListEmptyCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/ListEmptyCard',
}

export default meta
type Story = StoryObj<typeof meta>

/** One state and nothing else: its sentence, no button (22e). */
export const Playground: Story = {
  render: () => (
    <ListEmptyCard>
      <ListEmptyCardTitle>
        Ke schválení nečekají žádné rubriky.
      </ListEmptyCardTitle>
    </ListEmptyCard>
  ),
}

/** Anything else found nothing: the way back (22e). */
export const NoResult: Story = {
  render: () => {
    const router = createMemoryRouter(
      [
        {
          element: (
            <ListEmptyCard>
              <ListEmptyCardTitle>Nic nenalezeno</ListEmptyCardTitle>
              <ListEmptyCardText>
                Žádná rubrika neodpovídá nastaveným filtrům.
              </ListEmptyCardText>
              <ClearFiltersButton />
            </ListEmptyCard>
          ),
          path: '/administration/articles/categories',
        },
      ],
      {
        initialEntries: [
          {
            pathname: '/administration/articles/categories',
            search: '?q=ples',
          },
        ],
      },
    )

    return <RouterProvider router={router} />
  },
}
