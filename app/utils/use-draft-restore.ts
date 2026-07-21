import { useEffect, useState } from 'react'

import {
  type ArticleBackup,
  clearArticleBackup,
  readArticleBackup,
} from '~/utils/article-backup'

type Params<TValue> = {
  backupKey: string
  baseFormId: string
  baseDefaultValue: TValue
}

// Drives the save-on-leave banner and the restore-into-form flow. Restore works
// by feeding Conform a new defaultValue and a changed id — Conform resets the
// form to it — so the form stays in the route with no component remount.
export const useDraftRestore = <TValue extends Record<string, unknown>>({
  backupKey,
  baseFormId,
  baseDefaultValue,
}: Params<TValue>) => {
  const [backup, setBackup] = useState<ArticleBackup | null>(null)
  const [restoredValue, setRestoredValue] = useState<Record<
    string,
    unknown
  > | null>(null)

  // Read after mount to avoid a hydration mismatch: SSR and the first client
  // render both use the base defaults; the banner appears a tick later. Also
  // re-runs when backupKey changes (e.g. navigating between edit pages that
  // reuse this component) so a previous article's restored draft can't leak.
  useEffect(() => {
    setBackup(readArticleBackup(backupKey))
    setRestoredValue(null)
  }, [backupKey])

  const restore = () => {
    if (backup === null) return
    setRestoredValue(backup.value)
    setBackup(null)
  }

  const discard = () => {
    clearArticleBackup(backupKey)
    setBackup(null)
  }

  const defaultValue = (restoredValue ?? baseDefaultValue) as TValue
  const formId = restoredValue !== null ? `${baseFormId}-restored` : baseFormId

  return { backup, defaultValue, discard, formId, restore }
}
