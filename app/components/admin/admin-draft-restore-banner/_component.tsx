import { Banner, BannerActions, BannerContent } from '~/components/banner'
import { Button } from '~/components/button'

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
        <Button onClick={onRestore} type={'button'}>
          Obnovit
        </Button>
        <Button onClick={onDiscard} type={'button'} variant={'outline'}>
          Zahodit
        </Button>
      </BannerActions>
    </Banner>
  )
}
