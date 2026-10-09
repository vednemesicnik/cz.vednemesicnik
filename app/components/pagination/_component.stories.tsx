// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { Pagination } from './_component'

const meta: Meta<typeof Pagination> = {
  component: Pagination,
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
  title: 'Components/Pagination',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    currentPage: 2,
    layout: 'stacked',
    noun: 'článků',
    pageSize: 9,
    size: 'md',
    totalCount: 52,
    totalPages: 6,
  },
}

/** The administration list: 36 px, arrows only, summary on the left (design 22a). */
export const Administration: Story = {
  args: {
    ...Playground.args,
    currentPage: 1,
    layout: 'inline',
    pageSize: 20,
    size: 'sm',
    totalCount: 41,
    totalPages: 3,
  },
}

export const FirstPage: Story = {
  args: { ...Playground.args, currentPage: 1 },
}

export const LastPage: Story = {
  args: { ...Playground.args, currentPage: 6 },
}

/** Below 640 px the numbers give way to "Stránka 2 z 6" (design 11d). */
export const Mobile: Story = {
  args: Playground.args,
  globals: { viewport: { isRotated: false, value: 'mobile1' } },
}
