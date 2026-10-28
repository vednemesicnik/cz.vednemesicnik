import { schema } from '../_schema'

/** The field error for a taken address (27e, 2whigbz5; copy q34nuf6c). */
export const TAKEN_SLUG_MESSAGE = 'Zadejte jinou adresu — tato je obsazená.'

type Options = {
  /** Whether the server reported the address as taken. */
  isSlugTaken: (slug: string) => boolean
}

/**
 * The editor's own schema: the server's, plus the field error for an
 * address another podcast holds as published (design 27e, log 0039). The
 * server never refuses a save for it, so only the page validates it.
 *
 * @param options - What the saves reported as taken.
 * @returns The schema the editor's `onValidate` parses with.
 */
export const createEditorSchema = ({ isSlugTaken }: Options) =>
  schema.superRefine(({ slug }, context) => {
    if (slug !== '' && isSlugTaken(slug)) {
      context.addIssue({
        code: 'custom',
        message: TAKEN_SLUG_MESSAGE,
        path: ['slug'],
      })
    }
  })
