// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { AdminDetailItem } from '../admin-detail-item'
import { AdminDetailList } from '../admin-detail-list'
import { AdminDetailSection } from '../admin-detail-section'
import { AdminDetailLayout } from './_component'

const meta: Meta<typeof AdminDetailLayout> = {
  argTypes: {
    aside: { control: false },
    main: { control: false },
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
  <>
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
  </>
)

const aside = (
  <AdminDetailSection title="Metadata">
    <AdminDetailList>
      <AdminDetailItem label="Vytvořeno">1. 4. 2026</AdminDetailItem>
      <AdminDetailItem label="Upraveno">3. 4. 2026</AdminDetailItem>
    </AdminDetailList>
  </AdminDetailSection>
)

// The right column stands beside the main one from 820 px of container.
export const Playground: Story = {
  args: { aside, main },
}

// An empty right column is not drawn; the main column takes the full width.
export const WithoutAside: Story = {
  args: { main },
}

// Under 820 px the right column goes under the main one.
export const Narrow: Story = {
  args: { aside, main },
  decorators: [
    (Story) => (
      <div style={{ width: '760px' }}>
        <Story />
      </div>
    ),
  ],
}
