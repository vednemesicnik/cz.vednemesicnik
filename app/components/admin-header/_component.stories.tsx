import type { Meta, StoryObj } from "@storybook/react-vite"
import { MemoryRouter } from "react-router"

import { AdminUserMenu } from "~/components/admin-user-menu"

import { AdminHeader } from "./_component"

const meta: Meta<typeof AdminHeader> = {
  title: "Administration/AdministrationHeader",
  component: AdminHeader,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    children: {
      control: false,
      description: "Optional content (typically UserMenu component)",
    },
  },
}

export default meta
type Story = StoryObj<typeof AdminHeader>

/**
 * Default administration header without user menu.
 * Shows the logo, title, and empty menu slot.
 */
export const Default: Story = {
  args: {},
}

/**
 * Administration header with user menu.
 * Displays authenticated user with dropdown menu options.
 */
export const WithUserMenu: Story = {
  args: {
    children: (
      <AdminUserMenu userName="Jan Novák" userEmail="jan.novak@example.com" />
    ),
  },
}

/**
 * Administration header with user menu (email only).
 * Shows fallback to email when user has no name.
 */
export const WithUserMenuEmailOnly: Story = {
  args: {
    children: <AdminUserMenu userEmail="user@example.com" />,
  },
}

/**
 * Administration header with long user name.
 * Tests how the header handles lengthy user names.
 */
export const WithLongUserName: Story = {
  args: {
    children: (
      <AdminUserMenu
        userName="Alexandr Konstantinovič Novotný"
        userEmail="alexandr.novotny@example.com"
      />
    ),
  },
}
