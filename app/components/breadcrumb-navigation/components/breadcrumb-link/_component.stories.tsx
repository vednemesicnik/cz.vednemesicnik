import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { BreadcrumbLink } from './_component'

const meta: Meta<typeof BreadcrumbLink> = {
  component: BreadcrumbLink,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  tags: ['autodocs'],
  title: 'Navigation/BreadcrumbLink',
}

export default meta
type Story = StoryObj<typeof BreadcrumbLink>

export const Default: Story = {
  args: {
    children: 'Home',
    to: '/home',
  },
  render: (args) => (
    <BreadcrumbLink to={args.to}>{args.children}</BreadcrumbLink>
  ),
}
