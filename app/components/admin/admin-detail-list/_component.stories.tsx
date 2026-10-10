// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { AdminDetailItem } from '../admin-detail-item'
import { AdminDetailSection } from '../admin-detail-section'
import { AdminDetailList } from './_component'

const meta: Meta<typeof AdminDetailList> = {
  argTypes: {
    children: { control: false },
  },
  component: AdminDetailList,
  // The 480 px rule measures the section around the list.
  decorators: [
    (Story) => (
      <AdminDetailSection>
        <Story />
      </AdminDetailSection>
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
    <AdminDetailItem label="Autorská role">
      Koordinátor · spravuje veškerý obsah a schvaluje
    </AdminDetailItem>
    <AdminDetailItem label="Uživatelská role">Administrátor</AdminDetailItem>
    <AdminDetailItem label="Účet od">12. 3. 2024</AdminDetailItem>
  </>
)

export const Playground: Story = {
  args: {
    children: items,
  },
}

// Under 480 px the name stands above the value, as in the right column.
export const Narrow: Story = {
  args: {
    children: items,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
}
