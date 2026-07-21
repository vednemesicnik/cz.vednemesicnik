import { AdminButton } from '~/components/admin/admin-button'
import { Banner, BannerActions, BannerContent } from '~/components/banner'

type Props = {
  savedAt: string
  onRestore: () => void
  onDiscard: () => void
}

const dateTimeFormat = new Intl.DateTimeFormat('cs-CZ', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const formatSavedAt = (savedAt: string) => {
  const date = new Date(savedAt)
  return Number.isNaN(date.getTime()) ? savedAt : dateTimeFormat.format(date)
}

export const AdminDraftRestoreBanner = ({
  savedAt,
  onRestore,
  onDiscard,
}: Props) => {
  return (
    <Banner>
      <BannerContent>
        Máte rozpracovanou verzi uloženou v prohlížeči ({formatSavedAt(savedAt)}
        ). Chcete ji obnovit?
      </BannerContent>
      <BannerActions>
        <AdminButton onClick={onRestore} type={'button'}>
          Obnovit
        </AdminButton>
        <AdminButton onClick={onDiscard} type={'button'} variant={'secondary'}>
          Zahodit
        </AdminButton>
      </BannerActions>
    </Banner>
  )
}
