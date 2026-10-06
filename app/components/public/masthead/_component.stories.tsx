// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Masthead } from './_component'

const meta: Meta<typeof Masthead> = {
  component: Masthead,
  decorators: [
    (Story) => (
      <div style={{ containerType: 'inline-size', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/Masthead',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
