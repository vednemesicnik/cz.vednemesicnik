// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { AdminDetailAside } from '../admin-detail-aside'
import { AdminDetailItem } from '../admin-detail-item'
import { AdminDetailItemLabel } from '../admin-detail-item-label'
import { AdminDetailItemValue } from '../admin-detail-item-value'
import { AdminDetailList } from '../admin-detail-list'
import { AdminDetailMain } from '../admin-detail-main'
import { AdminDetailSection } from '../admin-detail-section'
import { AdminDetailSectionTitle } from '../admin-detail-section-title'
import { AdminDetailLayout } from './_component'

const meta: Meta<typeof AdminDetailLayout> = {
  argTypes: {
    children: { control: false },
  },
  component: AdminDetailLayout,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Administration/AdminDetailLayout',
}

export default meta
type Story = StoryObj<typeof meta>

const main = (
  <AdminDetailMain>
    <AdminDetailSection>
      <AdminDetailSectionTitle>Základní informace</AdminDetailSectionTitle>
      <AdminDetailList>
        <AdminDetailItem>
          <AdminDetailItemLabel>Název</AdminDetailItemLabel>
          <AdminDetailItemValue>Jarní číslo</AdminDetailItemValue>
        </AdminDetailItem>
        <AdminDetailItem>
          <AdminDetailItemLabel>Stav</AdminDetailItemLabel>
          <AdminDetailItemValue>publikováno</AdminDetailItemValue>
        </AdminDetailItem>
      </AdminDetailList>
    </AdminDetailSection>
    <AdminDetailSection>
      <AdminDetailSectionTitle>Soubory</AdminDetailSectionTitle>
      <AdminDetailList>
        <AdminDetailItem>
          <AdminDetailItemLabel>PDF</AdminDetailItemLabel>
          <AdminDetailItemValue>jarni-cislo.pdf</AdminDetailItemValue>
        </AdminDetailItem>
      </AdminDetailList>
    </AdminDetailSection>
  </AdminDetailMain>
)

const aside = (
  <AdminDetailAside>
    <AdminDetailSection>
      <AdminDetailSectionTitle>Metadata</AdminDetailSectionTitle>
      <AdminDetailList>
        <AdminDetailItem>
          <AdminDetailItemLabel>Vytvořeno</AdminDetailItemLabel>
          <AdminDetailItemValue>1. 4. 2026</AdminDetailItemValue>
        </AdminDetailItem>
        <AdminDetailItem>
          <AdminDetailItemLabel>Upraveno</AdminDetailItemLabel>
          <AdminDetailItemValue>3. 4. 2026</AdminDetailItemValue>
        </AdminDetailItem>
      </AdminDetailList>
    </AdminDetailSection>
  </AdminDetailAside>
)

// Full columns from 900 px of container; from 732 px narrower ones.
export const Playground: Story = {
  args: {
    children: (
      <>
        {main}
        {aside}
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '1000px' }}>
        <Story />
      </div>
    ),
  ],
}

// A right column whose sections all render nothing is not drawn; the main
// column takes the full width.
export const WithoutAside: Story = {
  args: {
    children: (
      <>
        {main}
        <AdminDetailAside>{false}</AdminDetailAside>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '1000px' }}>
        <Story />
      </div>
    ),
  ],
}

// From 732 to 900 px the columns narrow (440 + 32 + 260).
export const Narrow: Story = {
  args: {
    children: (
      <>
        {main}
        {aside}
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '760px' }}>
        <Story />
      </div>
    ),
  ],
}

// Under 732 px the right column goes under the main one.
export const Stacked: Story = {
  args: {
    children: (
      <>
        {main}
        {aside}
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '640px' }}>
        <Story />
      </div>
    ),
  ],
}
