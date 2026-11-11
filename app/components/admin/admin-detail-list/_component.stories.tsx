// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { AdminDetailItem } from '../admin-detail-item'
import { AdminDetailItemLabel } from '../admin-detail-item-label'
import { AdminDetailItemValue } from '../admin-detail-item-value'
import { AdminDetailSection } from '../admin-detail-section'
import { AdminDetailList } from './_component'

const meta: Meta<typeof AdminDetailList> = {
  argTypes: {
    children: { control: false },
  },
  component: AdminDetailList,
  // The 440 px rule measures the section around the list; `width` narrows it.
  decorators: [
    (Story, { parameters }) => (
      <div style={{ width: parameters.width }}>
        <AdminDetailSection>
          <Story />
        </AdminDetailSection>
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Administration/AdminDetailList',
}

export default meta
type Story = StoryObj<typeof meta>

const items = (
  <>
    <AdminDetailItem>
      <AdminDetailItemLabel>Autorská role</AdminDetailItemLabel>
      <AdminDetailItemValue>Koordinátor</AdminDetailItemValue>
    </AdminDetailItem>
    <AdminDetailItem>
      <AdminDetailItemLabel>Uživatelská role</AdminDetailItemLabel>
      <AdminDetailItemValue>Administrátor</AdminDetailItemValue>
    </AdminDetailItem>
    <AdminDetailItem>
      <AdminDetailItemLabel>Účet od</AdminDetailItemLabel>
      <AdminDetailItemValue>12. 3. 2024</AdminDetailItemValue>
    </AdminDetailItem>
  </>
)

export const Playground: Story = {
  args: {
    children: items,
  },
}

// Under 440 px the name stands above the value, as in the right column.
export const Narrow: Story = {
  args: {
    children: items,
  },
  parameters: { width: '300px' },
}
