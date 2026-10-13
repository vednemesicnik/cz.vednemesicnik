// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { type HistoryEntry, HistoryList } from './_component'

const meta: Meta<typeof HistoryList> = {
  component: HistoryList,
  decorators: [
    (Story) => (
      <div style={{ inlineSize: '300px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/HistoryList',
}

export default meta
type Story = StoryObj<typeof meta>

const createEntry = (
  id: string,
  label: string,
  actorName: string | null,
  formattedDateTime: string,
  note?: string,
): HistoryEntry => ({
  actorName,
  dateTime: '2026-09-19T06:00:00.000Z',
  formattedDateTime,
  id,
  label,
  note,
})

// Two rounds of review and a fix by the Coordinator (design 23e).
const rounds = [
  createEntry(
    '7',
    'Schváleno a publikováno',
    'Marie Horáková',
    '19. 9. 2026, 8:00',
  ),
  createEntry('6', 'Upraveno', 'Marie Horáková', '19. 9. 2026, 7:52'),
  createEntry(
    '5',
    'Odesláno ke schválení',
    'Ondřej Beneš',
    '18. 9. 2026, 19:02',
  ),
  createEntry('4', 'Vráceno k úpravám', 'Marie Horáková', '17. 9. 2026, 16:20'),
  createEntry(
    '3',
    'Odesláno ke schválení',
    'Ondřej Beneš',
    '17. 9. 2026, 11:08',
  ),
  createEntry('2', 'Upraveno', 'Ondřej Beneš', '16. 9. 2026, 21:40'),
  createEntry('1', 'Vytvořeno', 'Ondřej Beneš', '15. 9. 2026, 10:15'),
]

/**
 * Interactive base case (controls enabled): five rows, then *Celá historie*
 * expands the list in place.
 */
export const Playground: Story = {
  args: {
    entries: rounds,
    visibleCount: 5,
  },
}

/**
 * A publish-date change carries the old and the new date under its row (07f).
 */
export const PublishDateChange: Story = {
  args: {
    entries: [
      createEntry(
        '2',
        'Změněno datum publikace',
        'Marie Horáková',
        '20. 9. 2026, 9:12',
        'z 19. 9. 2026 na 18. 9. 2026',
      ),
      createEntry('1', 'Publikováno', 'Marie Horáková', '19. 9. 2026, 8:00'),
    ],
  },
}

/**
 * Content older than the log: its own dates without names, and the grey line
 * under them (07f).
 */
export const OlderThanTheLog: Story = {
  args: {
    entries: [
      createEntry('2', 'Upraveno', 'Jakub Novák', '27. 9. 2026, 14:02'),
      createEntry('published', 'Publikováno', null, '3. 2. 2025'),
      createEntry('created', 'Vytvořeno', null, '1. 2. 2025'),
    ],
    isIncomplete: true,
    visibleCount: 5,
  },
}
