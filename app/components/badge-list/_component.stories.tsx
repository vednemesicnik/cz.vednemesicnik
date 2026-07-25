// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { Badge } from '~/components/badge'
import { BadgeList } from './_component'

const meta: Meta<typeof BadgeList> = {
  component: BadgeList,
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
  title: 'Components/BadgeList',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: () => (
    <BadgeList>
      <Badge to={'/articles/category/reportaze'}>Reportáže</Badge>
      <Badge to={'/articles/category/rozhovory'}>Rozhovory</Badge>
      <Badge to={'/articles/tag/kultura'} variant={'outlined'}>
        Kultura
      </Badge>
    </BadgeList>
  ),
}
