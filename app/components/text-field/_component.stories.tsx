// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { TextField } from './_component'

const meta: Meta<typeof TextField> = {
  argTypes: {
    disabled: { control: 'boolean' },
    errors: { control: 'object' },
    hint: { control: 'text' },
    label: { control: 'text' },
    required: { control: 'boolean' },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
  },
  component: TextField,
  decorators: [
    (Story) => (
      <div style={{ width: '360px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "The design system's TextField: a label, an input, a hint and the errors under it, 6 px apart. No row is reserved for errors.",
      },
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/TextField',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    id: 'email',
    label: 'E-mail',
    placeholder: 'jmeno@vednemesicnik.cz',
    type: 'email',
  },
}

export const WithHint: Story = {
  args: {
    defaultValue: 'Veronika Pokorná',
    hint: 'Tak, jak bude uvedeno u obsahu.',
    id: 'name',
    label: 'Jméno',
  },
}

export const WithErrors: Story = {
  args: {
    defaultValue: '4817',
    errors: [
      'Zadejte aktuální kód z aplikace — tento nesouhlasí nebo už vypršel.',
    ],
    id: 'code',
    label: 'Kód',
  },
}

export const Required: Story = {
  args: {
    id: 'title',
    label: 'Název',
    required: true,
  },
}

export const Disabled: Story = {
  args: {
    defaultValue: 'jakub.novak@vednemesicnik.cz',
    disabled: true,
    id: 'disabled-email',
    label: 'E-mail',
  },
}
