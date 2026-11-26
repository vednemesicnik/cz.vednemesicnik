import type { ContentLogEvent } from '@generated/prisma/enums'

import { formatNumericDate } from '~/utils/format-numeric-date'
import { formatNumericDateTime } from '~/utils/format-numeric-date-time'

export type ContentHistoryEntry = {
  id: string
  dateTime: string
  formattedDateTime: string
  label: string
  actorName: string | null
  note: string | null
}

export type ContentHistory = {
  entries: ContentHistoryEntry[]
  isIncomplete: boolean
}

export type ContentLogRow = {
  id: string
  createdAt: Date
  event: ContentLogEvent
  detail: string | null
  actorId: string | null
  actorName: string | null
}

type ContentDates = {
  createdAt: Date
  publishedAt: Date | null
}

const labels: Record<ContentLogEvent, string> = {
  approve: 'Schváleno',
  archive: 'Archivováno',
  cover_uploaded: 'Obálka nahrána',
  create: 'Vytvořeno',
  pdf_uploaded: 'PDF nahráno',
  publish: 'Publikováno',
  restore: 'Obnoveno jako koncept',
  return: 'Vráceno k úpravám',
  set_published_at: 'Změněno datum publikace',
  submit: 'Odesláno ke schválení',
  take_over: 'Převzata úprava',
  unpublish: 'Staženo z publikace',
  update: 'Upraveno',
  withdraw: 'Vzato zpět do konceptu',
}

// The order the producers write the events of one step in; within one moment,
// the one written last is the newest.
const writeOrder: ContentLogEvent[] = [
  'create',
  'take_over',
  'update',
  'pdf_uploaded',
  'cover_uploaded',
  'submit',
  'withdraw',
  'return',
  'approve',
  'publish',
  'set_published_at',
  'unpublish',
  'archive',
  'restore',
]

// `formatPublishedAtChange` writes "<from ISO> → <to ISO>".
const PUBLISHED_AT_CHANGE = /^(?:(\S+) )?→ (\S+)$/

const formatTime = (date: Date) =>
  date.toLocaleTimeString('cs-CZ', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Europe/Prague',
  })

// „z 19. 9. 2026 na 18. 9. 2026“, with the times only when the time changed
// too, „z 19. 9. 2026 14:00 na 18. 9. 2026 9:30“ (07f); an unreadable detail
// gives no note.
const formatPublishedAtNote = (detail: string | null) => {
  const match = detail?.match(PUBLISHED_AT_CHANGE)

  if (!match) return null

  const to = new Date(match[2])

  if (match[1] === undefined) return `na ${formatNumericDate(to)}`

  const from = new Date(match[1])
  const format =
    formatTime(from) === formatTime(to)
      ? formatNumericDate
      : (date: Date) => `${formatNumericDate(date)} ${formatTime(date)}`

  return `z ${format(from)} na ${format(to)}`
}

const stepKey = (row: ContentLogRow) =>
  `${row.createdAt.getTime()}|${row.actorId}`

const createFallbackEntry = (
  id: string,
  label: string,
  date: Date,
): ContentHistoryEntry => ({
  actorName: null,
  dateTime: date.toISOString(),
  formattedDateTime: formatNumericDate(date),
  id,
  label,
  note: null,
})

/**
 * Turns a content's log into its Historie (design 07f): newest first, one row
 * per step. An approval and a publish of one step read „Schváleno a
 * publikováno“, and consecutive edits by one person merge into the newest.
 *
 * @param rows - The content's log rows, in any order.
 * @param dates - The content's own dates. Content older than the log has no
 *   `create` row: its creation and publish dates then close the list without a
 *   name, and `isIncomplete` adds „Starší události se nezaznamenávaly“.
 * @returns The rows to show and whether the log misses older events.
 */
export const toContentHistory = (
  rows: ContentLogRow[],
  dates: ContentDates,
): ContentHistory => {
  const sortedRows = [...rows].sort(
    (first, second) =>
      second.createdAt.getTime() - first.createdAt.getTime() ||
      writeOrder.indexOf(second.event) - writeOrder.indexOf(first.event),
  )

  const stepsWith = (event: ContentLogEvent) =>
    new Set(
      sortedRows
        .filter((row) => row.event === event)
        .map((row) => stepKey(row)),
    )
  const publishSteps = stepsWith('publish')
  const approveSteps = stepsWith('approve')

  const entries: ContentHistoryEntry[] = []
  let previousRow: ContentLogRow | null = null

  for (const row of sortedRows) {
    const isApprovalOfPublish =
      row.event === 'approve' && publishSteps.has(stepKey(row))
    const isRepeatedUpdate =
      row.event === 'update' &&
      row.actorId !== null &&
      previousRow?.event === 'update' &&
      previousRow.actorId === row.actorId

    if (!isApprovalOfPublish && !isRepeatedUpdate) {
      entries.push({
        actorName: row.actorName,
        dateTime: row.createdAt.toISOString(),
        formattedDateTime: formatNumericDateTime(row.createdAt),
        id: row.id,
        label:
          row.event === 'publish' && approveSteps.has(stepKey(row))
            ? 'Schváleno a publikováno'
            : labels[row.event],
        note:
          row.event === 'set_published_at'
            ? formatPublishedAtNote(row.detail)
            : null,
      })
    }

    previousRow = row
  }

  const isIncomplete = !rows.some((row) => row.event === 'create')

  if (isIncomplete) {
    const oldestLogged = sortedRows.at(-1)?.createdAt

    const created = createFallbackEntry('created', 'Vytvořeno', dates.createdAt)

    // Only a publish the log doesn't hold: the first logged publish stamps
    // `publishedAt` a moment before its own row.
    const published =
      dates.publishedAt !== null &&
      !rows.some((row) => row.event === 'publish') &&
      (oldestLogged === undefined || dates.publishedAt < oldestLogged)
        ? createFallbackEntry('published', 'Publikováno', dates.publishedAt)
        : null

    // Imported content can be published long before its row was created.
    entries.push(
      ...(published === null
        ? [created]
        : [published, created].sort((first, second) =>
            second.dateTime.localeCompare(first.dateTime),
          )),
    )
  }

  return { entries, isIncomplete }
}
