// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { AdminButton } from '~/components/admin/admin-button'

import { AdminTableToolbar } from './_component'

const meta: Meta<typeof AdminTableToolbar> = {
  component: AdminTableToolbar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Administration/AdminTableToolbar',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Lays out its children in a wrapping flex row with space between the leading
 * and trailing content. Sits between the page headline and the table.
 */
export const Playground: Story = {
  render: () => (
    <AdminTableToolbar>
      <input placeholder={'Hledat…'} type={'search'} />
      <AdminButton>Nový článek</AdminButton>
    </AdminTableToolbar>
  ),
}
