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

const noImage = createImageSources('user-image', undefined)

const meta: Meta<typeof AdministrationSidebar> = {
  argTypes: {
    contentItems: { control: false },
    peopleItems: { control: false },
    user: { control: 'object' },
  },
  component: AdministrationSidebar,
  // The sidebar's links and sign-out form need a data router; Články is active
  // unless a story sets another pathname.
  decorators: [
    (Story, context) => (
      <RouterProvider
        router={createMemoryRouter([{ element: <Story />, path: '*' }], {
          initialEntries: [
            context.parameters.pathname ?? '/administration/articles',
          ],
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

const peopleItems = [
  { label: 'Autoři', to: '/administration/authors' },
  { label: 'Uživatelé', to: '/administration/users' },
]

// A Coordinator who may see other people's records: both groups, under a rule.
// Nastavení sits under the name for every role (design 29a). The brand on top is
// not a link; the website link is in the page footer.
export const Playground: Story = {
  args: {
    contentItems,
    peopleItems,
    user: { image: noImage, name: 'Marie Horáková', roleLabel: 'Koordinátor' },
  },
}

// A member sees only their own record: no people group and no rule (design 22a);
// Nastavení under the name leads to the account.
export const OwnRecordOnly: Story = {
  args: {
    contentItems,
    peopleItems: [],
    user: { image: noImage, name: 'Anna Dvořáková', roleLabel: 'Přispěvatel' },
  },
}

// On the account's settings page Nastavení gets the active fill and no item does
// (u6432mlm).
export const SettingsPage: Story = {
  args: {
    contentItems,
    peopleItems,
    user: { image: noImage, name: 'Marie Horáková', roleLabel: 'Koordinátor' },
  },
  parameters: { pathname: '/administration/settings' },
}
