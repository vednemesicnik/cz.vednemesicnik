// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { ChipLabel } from '../chip-label'
import { ChipNote } from '../chip-note'
import { Chip } from './_component'

// The props are a union (a × always has its name), so the story is typed by
// its args and renders the chip itself.
type Args = {
  label: string
  note?: string
  muted: boolean
}

const meta = {
  args: {
    label: 'podzim',
    muted: false,
  },
  parameters: {
    layout: 'centered',
  },
  render: ({ label, note, muted }) => (
    <Chip muted={muted} onRemove={fn()} removeLabel={`Odebrat ${label}`}>
      <ChipLabel>{label}</ChipLabel>
      {note !== undefined && <ChipNote>{note}</ChipNote>}
    </Chip>
  ),
  tags: ['autodocs'],
  title: 'Primitives/Chip',
} satisfies Meta<Args>

export default meta
type Story = StoryObj<Args>

/**
 * Interactive base case (controls enabled): a picked tag (design 24a).
 */
export const Playground: Story = {}

/**
 * A picked value, an archived one still attached, and one without the ×.
 */
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      <Chip onRemove={fn()} removeLabel={'Odebrat podzim'}>
        <ChipLabel>podzim</ChipLabel>
      </Chip>
      <Chip muted onRemove={fn()} removeLabel={'Odebrat prázdniny'}>
        <ChipLabel>prázdniny</ChipLabel>
        <ChipNote>archivovaný</ChipNote>
      </Chip>
      <Chip>
        <ChipLabel>čtení</ChipLabel>
      </Chip>
    </div>
  ),
}
