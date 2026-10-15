import { useFetcher } from 'react-router'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { FORM_CONFIG } from '~/config/form-config'
import { useModalDialog } from '~/utils/use-modal-dialog'

type Props = {
  action: string
  fetcherKey: string
  intent: string
  confirmLabel: string
  title: string
  description: string
  onClose: () => void
}

/**
 * Confirms *Archivovat…* or *Stáhnout z publikace…* of a category or tag that
 * has published articles (design 25d, 3vnah8ji): what readers lose.
 *
 * @param props.intent - The state change the confirmation submits.
 * @param props.title - The question with the record's name.
 */
export const TaxonomyConfirmDialog = ({
  action,
  fetcherKey,
  intent,
  confirmLabel,
  title,
  description,
  onClose,
}: Props) => {
  const fetcher = useFetcher({ key: fetcherKey })
  const ref = useModalDialog(onClose)

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>{title}</AdminModalTitle>
        <AdminModalDescription>{description}</AdminModalDescription>

        <fetcher.Form
          action={action}
          method={'post'}
          onSubmit={() => ref.current?.close()}
        >
          <AuthenticityTokenInput />
          <input
            name={FORM_CONFIG.intent.name}
            type={'hidden'}
            value={intent}
          />

          <AdminModalActions>
            <Button
              onClick={() => ref.current?.close()}
              size={'sm'}
              type={'button'}
              variant={'ghost'}
            >
              Zrušit
            </Button>
            <Button size={'sm'} type={'submit'}>
              {confirmLabel}
            </Button>
          </AdminModalActions>
        </fetcher.Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
