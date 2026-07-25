// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { Badge } from './_component'

const meta: Meta<typeof Badge> = {
  component: Badge,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/Badge',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    children: 'Reportáže',
    to: '/articles/categories/reportaze',
    variant: 'filled',
  },
}

export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      <Badge to={'/articles/categories/reportaze'} variant={'filled'}>
        Reportáže
      </Badge>
      <Badge to={'/articles/tags/kultura'} variant={'outlined'}>
        Kultura
      </Badge>
    </div>
  ),
}
