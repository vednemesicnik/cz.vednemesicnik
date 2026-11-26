import { useEffect, useRef } from 'react'
import { href, Link, useFetcher } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
import { ActionMenuItem } from '~/components/action-menu-item'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { useToast } from '~/components/toast-provider'
import { Tooltip } from '~/components/tooltip'
import { FORM_CONFIG } from '~/config/form-config'
import type { FilterActionData, OwnFilter } from '~/types/saved-filter'
import { FILTER_PRESET_PARAM } from '~/utils/admin-list-filters'

import styles from './_styles.module.css'

const INTENT_VALUE = FORM_CONFIG.intent.value

type Props = {
  currentQuery: string
  filter: OwnFilter
  isActive: boolean
  onApply: () => void
  onDelete: (filter: OwnFilter) => void
  onRename: (filter: OwnFilter) => void
}

export const OwnFilterRow = ({
  currentQuery,
  filter,
  isActive,
  onApply,
  onDelete,
  onRename,
}: Props) => {
  const fetcher = useFetcher<FilterActionData>({
    key: `saved-filter-${filter.id}`,
  })
  const authenticityToken = useAuthenticityToken()
  const showToast = useToast()
  // The intent of the round trip in flight, answered once it is back.
  const submittedIntentRef = useRef<string | null>(null)
  // A name cut off by the menu's width shows whole in the Tooltip (jb81di02).
  const nameRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (fetcher.state !== 'idle' || submittedIntentRef.current === null) return

    const intent = submittedIntentRef.current
    submittedIntentRef.current = null

    if (
      intent === INTENT_VALUE.overwriteFilter &&
      fetcher.data?.submissionResult?.status === 'success'
    ) {
      showToast(`Přepsáno: ${filter.name}`)
    }
  }, [fetcher.data, fetcher.state, filter.name, showToast])

  const submitIntent = (intent: string) => {
    // `toggle-shared-filter` flips the stored value, so a second submit would
    // undo the first; the row waits out the round trip.
    if (fetcher.state !== 'idle') return

    const formData = new FormData()

    formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
    formData.append(FORM_CONFIG.intent.name, intent)
    formData.append('id', filter.id)
    formData.append('query', currentQuery)

    submittedIntentRef.current = intent
    void fetcher.submit(formData, {
      action: href('/administration/filters'),
      method: 'POST',
    })
  }

  return (
    <li className={styles.row}>
      <Tooltip
        className={styles.tooltip}
        label={filter.name}
        truncatedRef={nameRef}
      >
        <Link
          className={styles.apply}
          data-active={isActive || undefined}
          onClick={onApply}
          to={`?${filter.query}&${FILTER_PRESET_PARAM}=${filter.id}`}
        >
          <span className={styles.name} ref={nameRef}>
            {filter.name}
          </span>
          {filter.isDefault && <span className={styles.note}>výchozí</span>}
          {filter.isShared && <span className={styles.note}>sdílený</span>}
        </Link>
      </Tooltip>
      <ActionMenu label={`Další akce: ${filter.name}`} size={'sm'}>
        {filter.isDefault ? (
          <ActionMenuItem
            onSelect={() => submitIntent(INTENT_VALUE.unsetDefaultFilter)}
          >
            Zrušit jako výchozí
          </ActionMenuItem>
        ) : (
          <ActionMenuItem
            onSelect={() => submitIntent(INTENT_VALUE.setDefaultFilter)}
          >
            Nastavit jako výchozí
          </ActionMenuItem>
        )}
        <ActionMenuItem
          onSelect={() => submitIntent(INTENT_VALUE.toggleSharedFilter)}
        >
          {filter.isShared
            ? 'Přestat sdílet s ostatními'
            : 'Sdílet s ostatními'}
        </ActionMenuItem>
        {/* Nothing to copy into the filter in the default setting. */}
        {currentQuery !== '' && (
          <ActionMenuItem
            onSelect={() => submitIntent(INTENT_VALUE.overwriteFilter)}
          >
            Přepsat aktuálními filtry
          </ActionMenuItem>
        )}
        <ActionMenuItem onSelect={() => onRename(filter)}>
          Přejmenovat…
        </ActionMenuItem>
        <ActionMenuItem danger={true} onSelect={() => onDelete(filter)}>
          Smazat…
        </ActionMenuItem>
      </ActionMenu>
    </li>
  )
}
