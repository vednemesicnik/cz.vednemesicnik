// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { AdminActionButton } from '~/components/admin/admin-action-button'
import { ArrowUpwardIcon } from '~/components/icons/arrow-upward-icon'

import { AdminSplitButton } from './_component'

const meta: Meta<typeof AdminSplitButton> = {
  component: AdminSplitButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Administration/AdministrationSplitButton',
}

export default meta
type Story = StoryObj<typeof meta>

// Mirrors the epic #243 publish flow: two modes, both publishing.
const publishOptions = [
  { id: 'now', label: 'Zveřejnit' },
  { id: 'backdated', label: 'Zveřejnit zpětně' },
]

// The parent owns the selected mode and decides what the main segment renders.
const PublishSplitButton = () => {
  const [selectedId, setSelectedId] = useState(publishOptions[0].id)

  const selectedOption =
    publishOptions.find((option) => option.id === selectedId) ??
    publishOptions[0]

  return (
    <AdminSplitButton
      action={'publish'}
      onSelect={setSelectedId}
      options={publishOptions}
      selectedId={selectedId}
    >
      <AdminActionButton action={'publish'} type={'button'}>
        <ArrowUpwardIcon />
        {selectedOption.label}
      </AdminActionButton>
    </AdminSplitButton>
  )
}

/**
 * Publish split button as used on a draft article detail: the chevron opens a
 * menu of modes, and selecting one swaps the main segment's label.
 */
export const Playground: Story = {
  render: () => <PublishSplitButton />,
}
