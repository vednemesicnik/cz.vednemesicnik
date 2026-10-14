// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { Tabs } from './_component'

const items = [
  { end: true, label: 'Články', to: '/administration/articles' },
  { label: 'Rubriky', to: '/administration/articles/categories' },
  { label: 'Štítky', to: '/administration/articles/tags' },
]

const meta: Meta<typeof Tabs> = {
  component: Tabs,
  decorators: [
    (Story, { parameters }) => (
      <MemoryRouter initialEntries={[parameters.path ?? items[0].to]}>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/Tabs',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    items,
    label: 'Články',
  },
}

/** The middle tab active: the tabs around it keep their places. */
export const MiddleActive: Story = {
  args: Playground.args,
  parameters: { path: items[1].to },
}
