// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { createMemoryRouter, RouterProvider } from 'react-router'

import { AdminAvatar } from '~/components/admin/admin-avatar'
import { AdministrationSidebarFoot } from '~/components/administration-sidebar-foot'
import { AdministrationSidebarItem } from '~/components/administration-sidebar-item'
import { AdministrationSidebarList } from '~/components/administration-sidebar-list'
import { AdministrationSidebarNav } from '~/components/administration-sidebar-nav'
import { AdministrationSidebarSeparator } from '~/components/administration-sidebar-separator'
import { AdministrationSidebarUser } from '~/components/administration-sidebar-user'
import { AdministrationSidebarUserName } from '~/components/administration-sidebar-user-name'
import { AdministrationSidebarUserRole } from '~/components/administration-sidebar-user-role'
import { AdministrationSidebarUserText } from '~/components/administration-sidebar-user-text'
import { createImageSources } from '~/utils/image-store/create-image-sources'

import { ColumnAdministrationSidebar } from './_component'

const noImage = createImageSources('user-image', undefined)

// The content of the sidebar as the layout composes it: content sections, the
// people ones under a rule when there are any, and the user in the foot.
const renderContent = ({
  hasPeople,
  name,
  roleLabel,
}: {
  hasPeople: boolean
  name: string
  roleLabel: string
}) => (
  <>
    <AdministrationSidebarNav>
      <AdministrationSidebarList>
        <AdministrationSidebarItem end={true} to={'/administration'}>
          Přehled
        </AdministrationSidebarItem>
        <AdministrationSidebarItem to={'/administration/articles'}>
          Články
        </AdministrationSidebarItem>
        <AdministrationSidebarItem to={'/administration/podcasts'}>
          Podcasty
        </AdministrationSidebarItem>
        <AdministrationSidebarItem to={'/administration/archive'}>
          Archiv
        </AdministrationSidebarItem>
      </AdministrationSidebarList>
      {hasPeople && (
        <>
          <AdministrationSidebarSeparator />
          <AdministrationSidebarList>
            <AdministrationSidebarItem to={'/administration/authors'}>
              Autoři
            </AdministrationSidebarItem>
            <AdministrationSidebarItem to={'/administration/users'}>
              Uživatelé
            </AdministrationSidebarItem>
          </AdministrationSidebarList>
        </>
      )}
    </AdministrationSidebarNav>
    <AdministrationSidebarFoot>
      <AdministrationSidebarUser>
        <AdminAvatar
          alt={name}
          image={noImage}
          name={name}
          size={'extra-small'}
        />
        <AdministrationSidebarUserText>
          <AdministrationSidebarUserName>{name}</AdministrationSidebarUserName>
          <AdministrationSidebarUserRole>
            {roleLabel}
          </AdministrationSidebarUserRole>
        </AdministrationSidebarUserText>
      </AdministrationSidebarUser>
    </AdministrationSidebarFoot>
  </>
)

const meta: Meta<typeof ColumnAdministrationSidebar> = {
  argTypes: {
    children: { control: false },
  },
  component: ColumnAdministrationSidebar,
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
  title: 'Administration/ColumnAdministrationSidebar',
}

export default meta
type Story = StoryObj<typeof meta>

// A Coordinator who may see other people's records: both groups, under a rule.
// Nastavení sits under the name for every role (design 29a). The brand on top is
// not a link; the website link „Zobrazit web“ is right under it (s21ljh49).
export const Playground: Story = {
  args: {
    children: renderContent({
      hasPeople: true,
      name: 'Marie Horáková',
      roleLabel: 'Koordinátor',
    }),
  },
}

// A member sees only their own record: no people group and no rule (design 22a);
// Nastavení under the name leads to the account.
export const OwnRecordOnly: Story = {
  args: {
    children: renderContent({
      hasPeople: false,
      name: 'Anna Dvořáková',
      roleLabel: 'Přispěvatel',
    }),
  },
}

// On the account's settings page Nastavení gets the active fill and no item does
// (u6432mlm).
export const SettingsPage: Story = {
  args: Playground.args,
  parameters: { pathname: '/administration/settings' },
}
