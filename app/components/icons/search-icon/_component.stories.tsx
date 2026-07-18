// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { SearchIcon } from './_component'

const meta: Meta<typeof SearchIcon> = {
  component: SearchIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Icons/SearchIcon',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * The magnifier icon. Sizes to `1em` and inherits `currentColor`, so it scales
 * with the surrounding font-size and color.
 */
export const Playground: Story = {
  render: () => (
    <span style={{ color: 'var(--violet)', fontSize: '2rem' }}>
      <SearchIcon />
    </span>
  ),
}
