// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { LinkStrip } from './_component'

const meta: Meta<typeof LinkStrip> = {
  component: LinkStrip,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/LinkStrip',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    children: 'Články mají i štítky, třeba',
    links: ['volný čas', 'učitelé', 'knihy'].map((label) => ({
      label,
      to: `/articles/tags/${label}`,
    })),
    more: { label: 'Všechny štítky', to: '/articles/tags' },
  },
}

export const WithoutLinks: Story = {
  args: {
    children: 'Články třídíme i do rubrik.',
    more: { label: 'Všechny rubriky', to: '/articles/categories' },
  },
}
