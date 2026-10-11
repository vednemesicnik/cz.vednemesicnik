// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { AdminDetailAside } from '../admin-detail-aside'
import { AdminDetailItem } from '../admin-detail-item'
import { AdminDetailList } from '../admin-detail-list'
import { AdminDetailMain } from '../admin-detail-main'
import { AdminDetailSection } from '../admin-detail-section'
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
    <AdminDetailSection title="Základní informace">
      <AdminDetailList>
        <AdminDetailItem label="Název">Jarní číslo</AdminDetailItem>
        <AdminDetailItem label="Stav">publikováno</AdminDetailItem>
      </AdminDetailList>
    </AdminDetailSection>
    <AdminDetailSection title="Soubory">
      <AdminDetailList>
        <AdminDetailItem label="PDF">jarni-cislo.pdf</AdminDetailItem>
      </AdminDetailList>
    </AdminDetailSection>
  </AdminDetailMain>
)

const aside = (
  <AdminDetailAside>
    <AdminDetailSection title="Metadata">
      <AdminDetailList>
        <AdminDetailItem label="Vytvořeno">1. 4. 2026</AdminDetailItem>
        <AdminDetailItem label="Upraveno">3. 4. 2026</AdminDetailItem>
      </AdminDetailList>
    </AdminDetailSection>
  </AdminDetailAside>
)

// The right column stands beside the main one from 820 px of container.
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

// Under 820 px the right column goes under the main one.
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
