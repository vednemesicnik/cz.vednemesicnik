import { getIssuePublishedNumber } from '~/utils/issue/get-issue-published-number'
import { slugify } from '~/utils/slugify'

import { schema } from '../_schema'
import {
  getTakenIssueNumberMessage,
  type IssueNumberField,
} from './get-taken-issue-number-message'

/**
 * The editor's own schema: the server's, plus a field error for a number
 * another issue holds as published (26d, log 0039), at the field changed
 * last. The server never refuses a save for it, so only the page validates
 * it, from what the saves reported.
 *
 * @param isNumberTaken - Whether the server reported the number
 *   (`getIssuePublishedNumber`) as taken.
 * @param lastField - The number's field the editor changed last; *Pořadí v
 *   roce* when it changed none (6dlnv2de).
 * @returns The schema the editor's `onValidate` parses with.
 */
export const createEditorSchema = (
  isNumberTaken: (number: string) => boolean,
  lastField: IssueNumberField,
) =>
  schema.superRefine(({ year, order, supplement }, context) => {
    if (year === undefined || order === undefined) return

    const supplementSlug = slugify(supplement)
    // A supplement that can't be read has its own error.
    if (supplement !== '' && supplementSlug === '') return

    if (
      isNumberTaken(getIssuePublishedNumber({ order, supplementSlug, year }))
    ) {
      context.addIssue({
        code: 'custom',
        message: getTakenIssueNumberMessage({
          field: lastField,
          order,
          supplement: supplement === '' ? null : supplement,
          year,
        }),
        path: [lastField],
      })
    }
  })
