// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { TextFieldControl } from '~/components/text-field-control'
import { TextFieldHint } from '~/components/text-field-hint'
import { TextFieldLabel } from '~/components/text-field-label'

import { TextField } from './_component'

const meta: Meta<typeof TextField> = {
  argTypes: {
    children: { control: false },
    errors: { control: 'object' },
    required: { control: 'boolean' },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
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
          "The design system's TextField: a label, an input, a hint and the errors under it, 6 px apart. No row is reserved for errors. The field owns the input's id and `required`; `TextFieldLabel`, `TextFieldControl` and `TextFieldHint` read them.",
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
  },
  render: (args) => (
    <TextField {...args}>
      <TextFieldLabel>E-mail</TextFieldLabel>
      <TextFieldControl placeholder={'jmeno@vednemesicnik.cz'} type={'email'} />
    </TextField>
  ),
}

export const WithHint: Story = {
  args: {
    id: 'name',
  },
  render: (args) => (
    <TextField {...args}>
      <TextFieldLabel>Jméno</TextFieldLabel>
      <TextFieldControl defaultValue={'Veronika Pokorná'} />
      <TextFieldHint>Tak, jak bude uvedeno u obsahu.</TextFieldHint>
    </TextField>
  ),
}

export const WithErrors: Story = {
  args: {
    errors: [
      'Zadejte aktuální kód z aplikace — tento nesouhlasí nebo už vypršel.',
    ],
    id: 'code',
  },
  render: (args) => (
    <TextField {...args}>
      <TextFieldLabel>Kód</TextFieldLabel>
      <TextFieldControl defaultValue={'4817'} />
    </TextField>
  ),
}

export const Required: Story = {
  args: {
    id: 'title',
    required: true,
  },
  render: (args) => (
    <TextField {...args}>
      <TextFieldLabel>Název</TextFieldLabel>
      <TextFieldControl />
    </TextField>
  ),
}

export const Optional: Story = {
  args: {
    id: 'phone',
  },
  render: (args) => (
    <TextField {...args}>
      <TextFieldLabel optional>Telefon</TextFieldLabel>
      <TextFieldControl type={'tel'} />
    </TextField>
  ),
}

/** Sign-in and single-field dialogs: `required` on the input, no asterisk. */
export const RequiredMarkHidden: Story = {
  args: {
    id: 'code',
    required: true,
  },
  render: (args) => (
    <TextField {...args}>
      <TextFieldLabel isRequiredMarkHidden>Kód</TextFieldLabel>
      <TextFieldControl />
    </TextField>
  ),
}

/** An image tile's field (24b): small, with the hint only while focused. */
export const Small: Story = {
  args: {
    id: 'alt',
    size: 'sm',
  },
  render: (args) => (
    <TextField {...args}>
      <TextFieldLabel>Alt text</TextFieldLabel>
      <TextFieldControl placeholder={'Co je na obrázku'} />
      <TextFieldHint isShownOnFocus>
        Popis obrázku pro čtečky obrazovky a vyhledávače.
      </TextFieldHint>
    </TextField>
  ),
}

export const Disabled: Story = {
  args: {
    id: 'disabled-email',
  },
  render: (args) => (
    <TextField {...args}>
      <TextFieldLabel>E-mail</TextFieldLabel>
      <TextFieldControl
        defaultValue={'jakub.novak@vednemesicnik.cz'}
        disabled
      />
    </TextField>
  ),
}
