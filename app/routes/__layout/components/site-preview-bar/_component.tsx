import { Form, useLocation, useMatches } from 'react-router'

import { ButtonLink } from '~/components/button-link'
import { Link } from '~/components/link'
import { PreviewBar } from '~/components/preview-bar'
import { PreviewBarMarker } from '~/components/preview-bar-marker'
import { PreviewBarMessage } from '~/components/preview-bar-message'
import { PreviewBarNarrow } from '~/components/preview-bar-narrow'
import { PreviewBarTitle } from '~/components/preview-bar-title'
import { PreviewBarWide } from '~/components/preview-bar-wide'
import { findPagePreview } from '~/utils/content-preview/find-page-preview'
import type { PreviewEntity } from '~/utils/content-preview/page-preview'
import type { PreviewMode } from '~/utils/reader-view/get-preview-mode.server'

import styles from './_styles.module.css'

// The page of unpublished content says which (10d, kqyzagfd).
const ITEM_SENTENCES: Record<PreviewEntity, string> = {
  article: 'Tento článek čtenáři nevidí.',
  podcast: 'Tento podcast čtenáři nevidí.',
  podcast_episode: 'Tuto epizodu čtenáři nevidí.',
}

type Props = {
  previewMode: PreviewMode
}

/**
 * The website's preview bar (10d) for a signed-in author: on a page with
 * something the reader doesn't see, and on every page in the reader view, so
 * the preview can be switched back on anywhere.
 */
export const SitePreviewBar = ({ previewMode }: Props) => {
  const location = useLocation()
  const preview = findPagePreview(useMatches())

  if (previewMode === null) return null

  const redirectTo = location.pathname + location.search

  if (previewMode === 'reader') {
    return (
      <PreviewBar>
        <PreviewBarMessage>
          <PreviewBarTitle>Pohled čtenáře</PreviewBarTitle>
        </PreviewBarMessage>
        <Form
          action={'/resources/reader-view'}
          className={styles.form}
          method={'post'}
        >
          <input name={'redirectTo'} type={'hidden'} value={redirectTo} />
          <input name={'readerView'} type={'hidden'} value={'off'} />
          <ButtonLink className={styles.action} type={'submit'}>
            Zapnout náhled redakce
          </ButtonLink>
        </Form>
      </PreviewBar>
    )
  }

  if (preview === null) return null

  if (preview.kind === 'item') {
    return (
      <PreviewBar>
        <PreviewBarMessage>
          <PreviewBarTitle>
            Náhled redakce<PreviewBarWide>.</PreviewBarWide>
          </PreviewBarTitle>
          <PreviewBarWide> {ITEM_SENTENCES[preview.entity]}</PreviewBarWide>
        </PreviewBarMessage>
        <Link
          className={styles.action}
          prefetch={'none'}
          to={preview.administrationPath}
        >
          Zobrazit v administraci
        </Link>
      </PreviewBar>
    )
  }

  return (
    <PreviewBar>
      <PreviewBarMessage>
        <PreviewBarMarker />
        <PreviewBarTitle>
          Náhled redakce<PreviewBarWide>.</PreviewBarWide>
        </PreviewBarTitle>
        <PreviewBarWide>
          {' '}
          Obsah s čárkovaným rámečkem čtenáři nevidí.
        </PreviewBarWide>
      </PreviewBarMessage>
      <Form
        action={'/resources/reader-view'}
        className={styles.form}
        method={'post'}
      >
        <input name={'redirectTo'} type={'hidden'} value={redirectTo} />
        <input name={'readerView'} type={'hidden'} value={'on'} />
        <ButtonLink className={styles.action} type={'submit'}>
          <PreviewBarWide>Zobrazit jako čtenář</PreviewBarWide>
          <PreviewBarNarrow>Jako čtenář</PreviewBarNarrow>
        </ButtonLink>
      </Form>
    </PreviewBar>
  )
}
