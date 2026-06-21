// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { CopyButton } from './_component'

const meta: Meta<typeof CopyButton> = {
  argTypes: {
    children: {
      control: 'text',
      description: 'Text label displayed next to the icon',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    className: {
      control: false,
      description: 'Additional CSS class',
      table: {
        type: { summary: 'string' },
      },
    },
    value: {
      control: 'text',
      description: 'Text copied to clipboard on click',
      table: {
        type: { summary: 'string' },
      },
    },
  },
  component: CopyButton,
  parameters: {
    docs: {
      description: {
        component:
          'Button for copying text to the clipboard. On click, displays a checkmark icon for 2 seconds, then returns to its default state.',
      },
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/CopyButton',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    children: 'Text',
    value: 'Copiable text',
  },
}
