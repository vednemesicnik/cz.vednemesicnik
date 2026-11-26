// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { EpisodeNumber } from './_component'

const meta: Meta<typeof EpisodeNumber> = {
  component: EpisodeNumber,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/EpisodeNumber',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    children: 11,
  },
}
