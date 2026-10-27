import { isValidEpisodeLinkUrl } from '../../../utils/is-valid-episode-link-url'
import { schema } from '../_schema'

/** The field errors for a taken number and address (27f, copy qu300aws, q34nuf6c). */
export const TAKEN_NUMBER_MESSAGE = 'Zadejte jiné číslo — toto je obsazené.'
export const TAKEN_SLUG_MESSAGE = 'Zadejte jinou adresu — tato je obsazená.'

/** The field error for a link's address that can't be opened (27d, li7oq1zu). */
export const INVALID_LINK_URL_MESSAGE =
  'Zadejte adresu začínající http:// nebo https://.'

type Options = {
  /** Whether the server reported the number as taken. */
  isNumberTaken: (number: string) => boolean
  /** Whether the server reported the address as taken. */
  isSlugTaken: (slug: string) => boolean
}

/**
 * The editor's own schema: the server's, plus the field errors for a value
 * that saves and is still wrong (design 27d, 27f, log 0039): a number or an
 * address another episode of the podcast holds as published, and a link's
 * address that can't be opened. The server never refuses a save for them, so
 * only the page validates them.
 *
 * @param options - What the saves reported as taken.
 * @returns The schema the editor's `onValidate` parses with.
 */
export const createEditorSchema = ({ isNumberTaken, isSlugTaken }: Options) =>
  schema.superRefine(({ number, slug, links }, context) => {
    if (number !== undefined && isNumberTaken(String(number))) {
      context.addIssue({
        code: 'custom',
        message: TAKEN_NUMBER_MESSAGE,
        path: ['number'],
      })
    }

    if (slug !== '' && isSlugTaken(slug)) {
      context.addIssue({
        code: 'custom',
        message: TAKEN_SLUG_MESSAGE,
        path: ['slug'],
      })
    }

    // An empty address is unfinished, not wrong: 27h says it (2o0uwhgp).
    for (const [index, link] of (links ?? []).entries()) {
      if (link.url !== '' && !isValidEpisodeLinkUrl(link.url)) {
        context.addIssue({
          code: 'custom',
          message: INVALID_LINK_URL_MESSAGE,
          path: ['links', index, 'url'],
        })
      }
    }
  })
