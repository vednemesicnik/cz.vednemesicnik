// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { ParentLink } from './_component'

const meta: Meta<typeof ParentLink> = {
  component: ParentLink,
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
  title: 'Components/ParentLink',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    children: 'Rubriky',
    to: '/articles/categories',
  },
}

export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: '24px', justifyItems: 'start' }}>
      <ParentLink to={'/articles'}>Články</ParentLink>
      <ParentLink to={'/podcasts'}>Podcasty</ParentLink>
      <ParentLink to={'/podcasts/vednemesicnik-nahlas'}>
        Vedneměsíčník nahlas
      </ParentLink>
    </div>
  ),
}
