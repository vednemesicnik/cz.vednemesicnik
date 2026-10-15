// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { CATEGORY_NOUN, TAG_NOUN } from '~/config/list-noun-config'

import { ListCount } from './_component'

const meta: Meta<typeof ListCount> = {
  component: ListCount,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/ListCount',
}

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    count: 7,
    noun: CATEGORY_NOUN,
  },
}

export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <ListCount count={1} noun={CATEGORY_NOUN} />
      <ListCount count={3} noun={CATEGORY_NOUN} />
      <ListCount count={7} noun={CATEGORY_NOUN} />
      <ListCount count={12} noun={TAG_NOUN} />
    </div>
  ),
}
