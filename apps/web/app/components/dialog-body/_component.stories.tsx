// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { AdminModalDescription } from '~/components/admin/admin-modal-description'

import { DialogBody } from './_component'

const meta: Meta<typeof DialogBody> = {
  component: DialogBody,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/DialogBody',
}

export default meta
type Story = StoryObj<typeof meta>

/** Two paragraphs of one message, 12 px apart (in5bl1cq). */
export const Playground: Story = {
  render: () => (
    <div style={{ width: '412px' }}>
      <DialogBody>
        <AdminModalDescription>
          Obrázek se hned smaže i s alt textem a popiskem. Odebrání nelze
          vrátit.
        </AdminModalDescription>
        <AdminModalDescription>
          Článek zůstane bez hlavního obrázku.
        </AdminModalDescription>
      </DialogBody>
    </div>
  ),
}
