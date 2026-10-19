// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { CompactUploadStatus } from '~/components/compact-upload-status'

import { UploadStatus } from './_component'

const meta: Meta<typeof UploadStatus> = {
  component: UploadStatus,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/UploadStatus',
}

export default meta
type Story = StoryObj<typeof meta>

/** Under a tile's preview in the gallery panel (24b). */
export const Playground: Story = {
  args: {
    cancelLabel: 'Zrušit nahrávání ctenari.jpg',
    onCancel: () => {},
  },
  render: (args) => (
    <div style={{ width: '290px' }}>
      <UploadStatus {...args} />
    </div>
  ),
}

/** The narrow column's tile (24a): the word and the bar, no *Zrušit*. */
export const Compact: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ width: '130px' }}>
      <CompactUploadStatus />
    </div>
  ),
}
