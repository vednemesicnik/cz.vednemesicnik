// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { ErrorMessage } from '~/components/error-message'

import { FileDropField } from './_component'

const meta: Meta<typeof FileDropField> = {
  component: FileDropField,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/FileDropField',
}

export default meta
type Story = StoryObj<typeof meta>

/** A podcast's empty cover field (27e): a square slot. */
export const Playground: Story = {
  args: {
    accept: 'image/*',
    hint: 'nebo ji sem přetáhněte · obrázek do 5 MB',
    label: 'Vybrat obálku',
    onPick: () => {},
    shape: 'square',
  },
  render: (args) => (
    <div style={{ width: '220px' }}>
      <FileDropField {...args} />
    </div>
  ),
}

/** The issue's cover keeps a printed page's proportions (26c). */
export const Page: Story = {
  args: {
    ...Playground.args,
    shape: 'page',
  },
  render: Playground.render,
}

/** Outside the edit hold nothing uploads (07g). */
export const Disabled: Story = {
  args: {
    ...Playground.args,
    isDisabled: true,
  },
  render: Playground.render,
}

/** A pick refused at selection, its sentence under the field (26d). */
export const Refused: Story = {
  args: {
    ...Playground.args,
    errorId: 'cover-refused',
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: '8px', width: '220px' }}>
      <FileDropField {...args} />
      <div id={'cover-refused'}>
        <ErrorMessage>Vyberte obrázek — obalka.pdf není obrázek.</ErrorMessage>
      </div>
    </div>
  ),
}
