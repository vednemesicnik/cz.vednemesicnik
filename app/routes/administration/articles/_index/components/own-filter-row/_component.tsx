import { clsx } from 'clsx'
import { useEffect, useRef } from 'react'
import { href, Link, useFetcher } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
import type {
  FilterActionData,
  OwnFilter,
} from '~/components/admin/admin-saved-filters'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { useToast } from '~/components/toast-provider'
import { FORM_CONFIG } from '~/config/form-config'
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

  const menuItems = [
    filter.isDefault
      ? {
          label: 'Zrušit jako výchozí',
          onSelect: () => submitIntent(INTENT_VALUE.unsetDefaultFilter),
        }
      : {
          label: 'Nastavit jako výchozí',
          onSelect: () => submitIntent(INTENT_VALUE.setDefaultFilter),
        },
    {
      label: filter.isShared
        ? 'Přestat sdílet s ostatními'
        : 'Sdílet s ostatními',
      onSelect: () => submitIntent(INTENT_VALUE.toggleSharedFilter),
    },
    // Nothing to copy into the filter on Vše without a search or a filter.
    ...(currentQuery === ''
      ? []
      : [
          {
            label: 'Přepsat podle nastavení seznamu',
            onSelect: () => submitIntent(INTENT_VALUE.overwriteFilter),
          },
        ]),
    { label: 'Přejmenovat…', onSelect: () => onRename(filter) },
    { danger: true, label: 'Smazat…', onSelect: () => onDelete(filter) },
  ]

  return (
    <li className={styles.row}>
      <Link
        className={clsx(styles.apply, isActive && styles.applyActive)}
        onClick={onApply}
        to={`?${filter.query}&${FILTER_PRESET_PARAM}=${filter.id}`}
      >
        <span className={styles.name}>{filter.name}</span>
        {filter.isDefault && <span className={styles.note}>výchozí</span>}
        {filter.isShared && <span className={styles.note}>sdílený</span>}
      </Link>
      <ActionMenu
        items={menuItems}
        label={`Další akce: ${filter.name}`}
        size={'sm'}
      />
    </li>
  )
}
