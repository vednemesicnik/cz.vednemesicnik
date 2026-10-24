import { clsx } from 'clsx'
import { useEffect, useRef, useState } from 'react'

import { AuthorRemoveButton } from '~/components/author-remove-button'
import { AuthorRow } from '~/components/author-row'
import { AuthorRowButton } from '~/components/author-row-button'
import { ChipInput } from '~/components/chip-input'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { useReplaceFrame } from '~/hooks/use-replace-frame'
import { foldForSearch } from '~/utils/fold-for-search'
import { createImageSources } from '~/utils/image-store/create-image-sources'
import { USER_RECORD_COPY } from '../../../user-record-copy'
import styles from './_styles.module.css'

// An author without an account has no photo: the avatar shows the initials.
const NO_IMAGE = createImageSources('user-image', undefined)

type Author = {
  id: string
  name: string
  roleLabel: string
}

type Props = {
  /** The authors without an account, the only ones offered (28f). */
  authors: Author[]
  defaultAuthorId: string | null
  /** The hidden input's name and the search's id. */
  name: string
  id: string
  errors?: string[]
  /** The errors' id, which the search points to while they show. */
  errorId: string
}

/**
 * The existing author of Nový uživatel (design 28f): the chosen author with
 * their role, Změnit, which searches the authors without an account, as the
 * article's author search does (24j), and × to drop the choice (nstqrn5g).
 * With no author chosen, only the search; with none left, a line that says
 * so instead.
 */
export const ExistingAuthorField = ({
  authors,
  defaultAuthorId,
  name,
  id,
  errors,
  errorId,
}: Props) => {
  const [authorId, setAuthorId] = useState(defaultAuthorId)
  const changeRef = useRef<HTMLButtonElement>(null)
  // Zrušit, Esc and a choice return the focus to Změnit, as in 24j.
  const {
    frameProps,
    query,
    replacingKey,
    searchRef,
    setQuery,
    start: startChanging,
    stop: stopChanging,
  } = useReplaceFrame<string>({
    onRefocus: () => changeRef.current?.focus(),
  })
  // Outside the frame, where the focus goes once the row or the search is
  // rendered: the search after ×, Změnit after the first choice.
  const focusTargetRef = useRef<'search' | 'change' | null>(null)

  const author = authors.find((candidate) => candidate.id === authorId)
  const isChanging = replacingKey !== null
  const isSearching = author === undefined || isChanging
  const hasErrors = errors !== undefined && errors.length > 0

  useEffect(() => {
    const target = focusTargetRef.current
    focusTargetRef.current = null
    if (target === 'search') searchRef.current?.focus()
    if (target === 'change') changeRef.current?.focus()
  })

  // Sent without an author: the search takes the focus, as an invalid field
  // would; the hidden input it stands for is not there to take it.
  useEffect(() => {
    if (hasErrors) searchRef.current?.focus()
  }, [hasErrors, searchRef])

  if (authors.length === 0) {
    return <p className={styles.field}>{USER_RECORD_COPY.author.noneLeft}</p>
  }

  const options = authors
    .filter(
      (candidate) =>
        candidate.id !== authorId &&
        foldForSearch(candidate.name).includes(foldForSearch(query.trim())),
    )
    .map((candidate) => ({
      avatar: NO_IMAGE,
      label: candidate.name,
      note: candidate.roleLabel,
      value: candidate.id,
    }))

  const choose = (chosenAuthorId: string) => {
    setAuthorId(chosenAuthorId)
    // The first choice has no frame to end, so the field moves the focus.
    if (isChanging) {
      stopChanging({ refocus: true })
    } else {
      focusTargetRef.current = 'change'
    }
  }
  // × drops the choice: the empty search with the focus in it, the removed
  // author offered again (nstqrn5g).
  const remove = () => {
    setAuthorId(null)
    setQuery('')
    focusTargetRef.current = 'search'
  }

  const search = isSearching && (
    <ChipInput
      emptyLabel={USER_RECORD_COPY.author.noneMatching}
      errorId={hasErrors ? errorId : undefined}
      id={id}
      isLabelHidden
      label={USER_RECORD_COPY.author.searchLabel}
      onQueryChange={setQuery}
      onSelect={choose}
      options={options}
      placeholder={USER_RECORD_COPY.author.searchPlaceholder}
      query={query}
      ref={searchRef}
    />
  )

  return (
    <div className={styles.field}>
      {author === undefined ? (
        search
      ) : (
        <div
          className={clsx(styles.frame, isChanging && styles.changing)}
          {...frameProps}
        >
          <AuthorRow
            image={NO_IMAGE}
            name={author.name}
            note={author.roleLabel}
          >
            {isChanging ? (
              <AuthorRowButton
                aria-label={'Zrušit změnu autora'}
                key={'cancel'}
                onClick={() => stopChanging({ refocus: true })}
              >
                Zrušit
              </AuthorRowButton>
            ) : (
              <>
                <AuthorRowButton
                  aria-label={`Změnit autora: ${author.name}`}
                  key={'change'}
                  onClick={() => startChanging(author.id)}
                  ref={changeRef}
                >
                  Změnit
                </AuthorRowButton>
                <AuthorRemoveButton
                  key={'remove'}
                  name={author.name}
                  onClick={remove}
                />
              </>
            )}
          </AuthorRow>
          {search}
        </div>
      )}

      {author !== undefined && (
        <input name={name} type={'hidden'} value={author.id} />
      )}

      {errors !== undefined && hasErrors && (
        <ErrorMessageGroup id={errorId}>
          {errors.map((error) => (
            <ErrorMessage key={error}>{error}</ErrorMessage>
          ))}
        </ErrorMessageGroup>
      )}
    </div>
  )
}
