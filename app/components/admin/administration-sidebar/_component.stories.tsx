// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { createMemoryRouter, RouterProvider } from 'react-router'

import { createImageSources } from '~/utils/image-store/create-image-sources'

import { AdministrationSidebar } from './_component'

const contentItems = [
  { end: true, label: 'Přehled', to: '/administration' },
  { label: 'Články', to: '/administration/articles' },
  { label: 'Podcasty', to: '/administration/podcasts' },
  { label: 'Archiv', to: '/administration/archive' },
]

const settingsItem = { label: 'Nastavení', to: '/administration/settings' }

const noImage = createImageSources('user-image', undefined)

const meta: Meta<typeof AdministrationSidebar> = {
  argTypes: {
    contentItems: { control: false },
    peopleItems: { control: false },
    user: { control: 'object' },
  },
  component: AdministrationSidebar,
  // The sidebar's links and sign-out form need a data router; Články is active.
  decorators: [
    (Story) => (
      <RouterProvider
        router={createMemoryRouter([{ element: <Story />, path: '*' }], {
          initialEntries: ['/administration/articles'],
        })}
      />
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Administration/AdministrationSidebar',
}

export default meta
type Story = StoryObj<typeof meta>

// A Coordinator who may see other people's records: both groups, under a rule.
export const Playground: Story = {
  args: {
    contentItems,
    peopleItems: [
      { label: 'Autoři', to: '/administration/authors' },
      { label: 'Uživatelé', to: '/administration/users' },
      settingsItem,
    ],
    user: { image: noImage, name: 'Marie Horáková', roleLabel: 'Koordinátor' },
  },
}

// A member sees only their own record, so Autoři and Uživatelé are left out
// (design 22a); Nastavení leads to it.
export const OwnRecordOnly: Story = {
  args: {
    contentItems,
    peopleItems: [settingsItem],
    user: { image: noImage, name: 'Anna Dvořáková', roleLabel: 'Přispěvatel' },
  },
}
