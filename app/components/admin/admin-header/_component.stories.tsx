import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { AdminHeader } from './_component'

const meta: Meta<typeof AdminHeader> = {
  argTypes: {
    children: {
      control: false,
      description: 'Optional content on the right of the header',
    },
  },
  component: AdminHeader,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Administration/AdministrationHeader',
}

export default meta
type Story = StoryObj<typeof AdminHeader>

/**
 * The header of the sign-in pages: the logo and the title. Signed-in pages have
 * the sidebar instead (design 22a).
 */
export const Default: Story = {
  args: {},
}
