// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'

import { FilterMenu } from './_component'

const meta: Meta<typeof FilterMenu> = {
  component: FilterMenu,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Administration/Articles/FilterMenu',
}

export default meta
type Story = StoryObj<typeof meta>

// `useNavigate` needs a router; a data router keeps it close to the app.
const withRouterAt = (search: string, children: ReactElement) => {
  const router = createMemoryRouter(
    [{ element: children, path: '/administration/articles' }],
    { initialEntries: [{ pathname: '/administration/articles', search }] },
  )

  return <RouterProvider router={router} />
}

const CATEGORY_OPTIONS = [
  { label: 'Kultura', value: 'kultura' },
  { label: 'Reportáž', value: 'reportaz' },
  { label: 'Rozhovor', value: 'rozhovor' },
  { label: 'Škola', value: 'skola' },
  { label: 'Sport', value: 'sport' },
]

const TAG_OPTIONS = [
  { label: 'maturitní ročník a přijímací zkoušky', value: 'maturita' },
  { label: 'ples', value: 'ples' },
  { label: 'přijímačky', value: 'prijimacky' },
]

/** No value: the button carries only the filter's name, on the grey track. */
export const Playground: Story = {
  render: () =>
    withRouterAt(
      '',
      <FilterMenu
        clearLabel={'Všechny'}
        label={'Rubrika'}
        name={'category'}
        options={CATEGORY_OPTIONS}
        selectedValues={[]}
      />,
    ),
}

/** Two values are listed: „Rubrika: Škola, Sport“. */
export const TwoValues: Story = {
  render: () =>
    withRouterAt(
      '?category=skola&category=sport',
      <FilterMenu
        clearLabel={'Všechny'}
        label={'Rubrika'}
        name={'category'}
        options={CATEGORY_OPTIONS}
        selectedValues={['skola', 'sport']}
      />,
    ),
}

/**
 * From three values the first one and „+N“; a long first value is truncated,
 * „+2“ stays visible. The tag menu has a search field.
 */
export const ThreeValuesTruncated: Story = {
  render: () =>
    withRouterAt(
      '?tag=maturita&tag=ples&tag=prijimacky',
      <FilterMenu
        clearLabel={'Všechny'}
        label={'Štítek'}
        name={'tag'}
        options={TAG_OPTIONS}
        searchPlaceholder={'Hledat štítek'}
        selectedValues={['maturita', 'ples', 'prijimacky']}
      />,
    ),
}

const STATE_OPTIONS = [
  { count: 12, label: 'Koncepty', value: 'draft' },
  { attention: true, count: 2, label: 'Ke schválení', value: 'pending' },
  { count: 3, label: 'Schválené', value: 'approved' },
  { label: 'Publikované', value: 'published' },
  { label: 'Archivované', value: 'archived' },
]

/** The Stav menu counts its work; Ke schválení in ink for the Coordinator. */
export const StateWithCounts: Story = {
  render: () =>
    withRouterAt(
      '?state=draft',
      <FilterMenu
        clearLabel={'Vše'}
        label={'Stav'}
        name={'state'}
        options={STATE_OPTIONS}
        selectedValues={['draft']}
      />,
    ),
}

/** The Coordinator's waiting work on the button: „Stav 2“, read as „Stav, na
 * schválení čekají celkem 2 články“ (cioukqn6). */
export const StateWithWaitingWork: Story = {
  render: () =>
    withRouterAt(
      '',
      <FilterMenu
        attention={{
          count: 2,
          description: 'na schválení čekají celkem 2 články',
        }}
        clearLabel={'Vše'}
        label={'Stav'}
        name={'state'}
        options={STATE_OPTIONS}
        selectedValues={[]}
      />,
    ),
}

/** The count follows the values and stays with Ke schválení selected. */
export const StateWithValuesAndWaitingWork: Story = {
  render: () =>
    withRouterAt(
      '?state=draft&state=pending',
      <FilterMenu
        attention={{
          count: 5,
          description: 'na schválení čeká celkem 5 článků',
        }}
        clearLabel={'Vše'}
        label={'Stav'}
        name={'state'}
        options={STATE_OPTIONS}
        selectedValues={['draft', 'pending']}
      />,
    ),
}
