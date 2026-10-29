// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { ARTICLE_BULK_NOUN } from '~/config/bulk-noun-config'

import { BulkConfirmDialog } from './_component'

const meta: Meta<typeof BulkConfirmDialog> = {
  component: BulkConfirmDialog,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Components/BulkConfirmDialog',
}

export default meta
type Story = StoryObj<typeof meta>

const ARTICLES = [
  { id: 'a1', title: 'Deset knih na podzim, které nejsou v osnovách' },
  { id: 'a2', title: 'Co se změní na přijímačkách v roce 2027' },
]

/** Archiving two published articles (22c); Enter confirms. */
export const Playground: Story = {
  args: {
    action: 'archive',
    isCreator: false,
    noun: ARTICLE_BULK_NOUN,
    onClose: fn(),
    onConfirm: fn(),
    onlyDrafts: false,
    records: ARTICLES,
    skipped: null,
  },
}

/** A Creator retracts: who publishes again follows the first sentence (22c). */
export const CreatorRetract: Story = {
  args: { ...Playground.args, action: 'retract', isCreator: true },
}

/** Restoring archived articles as drafts (y0xq33k8). */
export const Restore: Story = {
  args: { ...Playground.args, action: 'restore' },
}

/** Deleting drafts: koncepty, the danger button, no Enter (22c). */
export const DeleteDrafts: Story = {
  args: { ...Playground.args, action: 'delete', onlyDrafts: true },
}

/** One selected article someone else edits is skipped and said apart (22f). */
export const HeldSkipped: Story = {
  args: {
    ...Playground.args,
    skipped: '1 článek právě někdo upravuje. Přeskočí se.',
  },
}
