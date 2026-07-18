// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'

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

const withRouterAt = (search: string, children: ReactNode) => (
  <MemoryRouter
    initialEntries={[{ pathname: '/administration/articles', search }]}
  >
    {children}
  </MemoryRouter>
)

/**
 * Empty search: just the input and submit button, no clear link.
 */
export const Playground: Story = {
  render: () =>
    withRouterAt(
      '',
      <AdminTableSearch defaultValue={''} placeholder={'Hledat články…'} />,
    ),
}

/**
 * Active search: `q` is present, so the „Zrušit" clear link appears. The current
 * sort/order are carried as hidden inputs and preserved by the clear link.
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
