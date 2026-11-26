import { schema } from '../_schema'

/** The field error for an address another article holds (24d, copy q34nuf6c). */
const TAKEN_SLUG_MESSAGE = 'Zadejte jinou adresu — tato je obsazená.'

/**
 * The editor's own schema: the server's, plus a field error for an address
 * another article holds as published (log 0039). The server never refuses a
 * save for it, so only the page validates it, from what the saves reported.
 *
 * @param isSlugTaken - Whether the server reported the address as taken.
 * @returns The schema the editor's `onValidate` parses with.
 */
export const createEditorSchema = (isSlugTaken: (slug: string) => boolean) =>
  schema.superRefine(({ slug }, context) => {
    if (slug !== '' && isSlugTaken(slug)) {
      context.addIssue({
        code: 'custom',
        message: TAKEN_SLUG_MESSAGE,
        path: ['slug'],
      })
    }
  })
