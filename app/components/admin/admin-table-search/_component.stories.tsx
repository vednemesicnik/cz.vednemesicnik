// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'

import { AdminTableSearch } from './_component'

const meta: Meta<typeof AdminTableSearch> = {
  component: AdminTableSearch,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Administration/AdminTableSearch',
}

export default meta
type Story = StoryObj<typeof meta>

// `useSubmit` needs a data router, so `MemoryRouter` is not enough here.
const withRouterAt = (search: string, children: ReactElement) => {
  const router = createMemoryRouter(
    [{ element: children, path: '/administration/articles' }],
    { initialEntries: [{ pathname: '/administration/articles', search }] },
  )

  return <RouterProvider router={router} />
}

/**
 * Empty search: just the field, no ✕. The field searches as you type, so the
 * „Hledat" button is only the no-JS fallback and is hidden here, because
 * Storybook runs with scripting enabled.
 */
export const Playground: Story = {
  render: () =>
    withRouterAt(
      '',
      <AdminTableSearch defaultValue={''} placeholder={'Hledat články…'} />,
    ),
}

/**
 * Active search: the field has text, so the ✕ appears. The ✕ or Esc clears the
 * search at once. The current sort/order are carried as hidden inputs and
 * survive a search or a clear.
 */
export const WithQuery: Story = {
  render: () =>
    withRouterAt(
      '?q=redakce&sort=title&order=asc',
      <AdminTableSearch
        defaultValue={'redakce'}
        placeholder={'Hledat články…'}
      />,
    ),
}
