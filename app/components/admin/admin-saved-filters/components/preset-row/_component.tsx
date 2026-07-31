import { clsx } from 'clsx'
import { href, Link, useFetcher } from 'react-router'

import type {
  FilterActionData,
  OwnFilter,
} from '~/components/admin/admin-saved-filters/_types'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { EditIcon } from '~/components/icons/edit-icon'
import { RefreshIcon } from '~/components/icons/refresh-icon'
import { FORM_CONFIG } from '~/config/form-config'
import { FILTER_PRESET_PARAM } from '~/utils/admin-list-filters'

import styles from './_styles.module.css'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value

type Props = {
  currentQuery: string
  filter: OwnFilter
  isActive: boolean
  onDelete: (filterId: string) => void
  onRename: (filter: OwnFilter) => void
}

export const PresetRow = ({
  currentQuery,
  filter,
  isActive,
  onDelete,
  onRename,
}: Props) => {
  const fetcher = useFetcher<FilterActionData>({
    key: `saved-filter-${filter.id}`,
  })

  // `toggle-shared-filter` flips the stored value instead of setting it, so a
  // second submit would undo the first — the whole row waits out the round trip.
  const isPending = fetcher.state !== 'idle'

  return (
    <li className={styles.row}>
      <Link
        className={clsx(styles.apply, isActive && styles.applyActive)}
        to={`?${filter.query}&${FILTER_PRESET_PARAM}=${filter.id}`}
      >
        <span className={styles.name}>{filter.name}</span>
        {filter.isDefault && <span className={styles.badge}>výchozí</span>}
      </Link>

      <fetcher.Form
        action={href('/administration/filters')}
        className={styles.actions}
        method={'post'}
      >
        <AuthenticityTokenInput />
        <input name={'id'} type={'hidden'} value={filter.id} />
        <input name={'query'} type={'hidden'} value={currentQuery} />

        <button
          aria-pressed={filter.isDefault}
          className={clsx(styles.toggle, filter.isDefault && styles.toggleOn)}
          disabled={isPending}
          name={INTENT_NAME}
          title={
            filter.isDefault
              ? 'Zrušit jako výchozí filtr'
              : 'Nastavit jako výchozí filtr'
          }
          type={'submit'}
          value={
            filter.isDefault
              ? INTENT_VALUE.unsetDefaultFilter
              : INTENT_VALUE.setDefaultFilter
          }
        >
          Výchozí
        </button>

        <button
          aria-pressed={filter.isShared}
          className={clsx(styles.toggle, filter.isShared && styles.toggleOn)}
          disabled={isPending}
          name={INTENT_NAME}
          title={
            filter.isShared
              ? 'Přestat sdílet s ostatními'
              : 'Sdílet s ostatními'
          }
          type={'submit'}
          value={INTENT_VALUE.toggleSharedFilter}
        >
          Sdílený
        </button>

        {/* Nothing to copy into the preset when no filter is set. */}
        {currentQuery !== '' && (
          <button
            aria-label={'Přepsat aktuálním filtrem'}
            className={styles.iconButton}
            disabled={isPending}
            name={INTENT_NAME}
            title={'Přepsat aktuálním filtrem'}
            type={'submit'}
            value={INTENT_VALUE.overwriteFilter}
          >
            {/* The icons carry their own accessible name; the button already has
                one, so keep the duplicate out of the accessibility tree. */}
            <span aria-hidden={'true'} className={styles.icon}>
              <RefreshIcon />
            </span>
          </button>
        )}

        <button
          aria-label={'Přejmenovat filtr'}
          className={styles.iconButton}
          disabled={isPending}
          onClick={() => onRename(filter)}
          title={'Přejmenovat'}
          type={'button'}
        >
          <span aria-hidden={'true'} className={styles.icon}>
            <EditIcon />
          </span>
        </button>

        <button
          aria-label={'Smazat filtr'}
          className={clsx(styles.iconButton, styles.iconButtonDanger)}
          disabled={isPending}
          onClick={() => onDelete(filter.id)}
          title={'Smazat'}
          type={'button'}
        >
          <span aria-hidden={'true'} className={styles.icon}>
            <DeleteIcon />
          </span>
        </button>
      </fetcher.Form>
    </li>
  )
}
