import { clsx } from 'clsx'
import {
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import { AuthorRow } from '~/components/author-row'
import { AuthorRowButton } from '~/components/author-row-button'
import { ChipInput } from '~/components/chip-input'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
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
}

/**
 * The existing author of Nový uživatel (design 28f): the chosen author with
 * their role and Změnit, which searches the authors without an account, as
 * the article's author search does (24j). With no author chosen yet, only the
 * search; with none left, a line that says so instead.
 */
export const ExistingAuthorField = ({
  authors,
  defaultAuthorId,
  name,
  id,
  errors,
}: Props) => {
  const [authorId, setAuthorId] = useState(defaultAuthorId)
  const [isChanging, setIsChanging] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const changeRef = useRef<HTMLButtonElement>(null)
  // Where the focus goes once the row or the search is rendered.
  const focusTargetRef = useRef<'search' | 'change' | null>(null)

  const author = authors.find((candidate) => candidate.id === authorId)
  const isSearching = author === undefined || isChanging

  useEffect(() => {
    const target = focusTargetRef.current
    focusTargetRef.current = null
    if (target === 'search') searchRef.current?.focus()
    if (target === 'change') changeRef.current?.focus()
  })

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

  const startChanging = () => {
    setQuery('')
    setIsChanging(true)
    focusTargetRef.current = 'search'
  }
  // Zrušit and Esc return the focus to Změnit; leaving the frame (a click or
  // Tab elsewhere) keeps it where it went.
  const stopChanging = ({ refocus }: { refocus: boolean }) => {
    setIsChanging(false)
    focusTargetRef.current = refocus ? 'change' : null
  }
  const choose = (chosenAuthorId: string) => {
    setAuthorId(chosenAuthorId)
    stopChanging({ refocus: true })
  }

  // Esc cancels at once, the open list included, as in 24j.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    stopChanging({ refocus: true })
  }
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      stopChanging({ refocus: false })
    }
  }
  // A press anywhere in the frame but the field keeps the focus in the field:
  // a click that does not focus (Zrušit in Safari, the name) is no leaving.
  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element && event.target.closest('input'))) {
      event.preventDefault()
    }
  }

  const search = isSearching && (
    <ChipInput
      emptyLabel={USER_RECORD_COPY.author.noneMatching}
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
        // biome-ignore lint/a11y/noStaticElementInteractions: the frame only watches its row and search
        <div
          className={clsx(styles.frame, isChanging && styles.changing)}
          onBlur={isChanging ? handleBlur : undefined}
          onKeyDownCapture={isChanging ? handleKeyDown : undefined}
          onMouseDown={isChanging ? handleMouseDown : undefined}
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
              <AuthorRowButton
                aria-label={`Změnit autora: ${author.name}`}
                key={'change'}
                onClick={startChanging}
                ref={changeRef}
              >
                Změnit
              </AuthorRowButton>
            )}
          </AuthorRow>
          {search}
        </div>
      )}

      {author !== undefined && (
        <input name={name} type={'hidden'} value={author.id} />
      )}

      {errors !== undefined && errors.length > 0 && (
        <ErrorMessageGroup>
          {errors.map((error) => (
            <ErrorMessage key={error}>{error}</ErrorMessage>
          ))}
        </ErrorMessageGroup>
      )}
    </div>
  )
}
