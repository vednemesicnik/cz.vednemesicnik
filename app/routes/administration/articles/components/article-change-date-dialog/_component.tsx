import type { RefObject } from 'react'

import { AdminPublishDateDialog } from '~/components/admin/admin-publish-date-dialog'
import { FORM_CONFIG } from '~/config/form-config'

type Props = {
  ref: RefObject<HTMLDialogElement | null>
  action: string
  fetcherKey: string
  publishedAt: string | null
}

/** Změnit datum publikace… of a published article (07c), the Coordinator's. */
export const ArticleChangeDateDialog = ({
  ref,
  action,
  fetcherKey,
  publishedAt,
}: Props) => (
  <AdminPublishDateDialog
    action={action}
    confirmLabel={'Změnit datum'}
    defaultPublishedAt={publishedAt ?? undefined}
    description={
      'Skutečně si přejete změnit datum vydání? Článek se přeřadí ve výpisu a změní se datum publikace v metadatech pro vyhledávače. Akce je určena k opravě chyb.'
    }
    fetcherKey={fetcherKey}
    intent={FORM_CONFIG.intent.value.changePublishedAt}
    ref={ref}
    title={'Změnit datum vydání'}
  />
)
