import type { ContentState } from '@generated/prisma/enums'
import { href } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
import { Image } from '~/components/image'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import { StatusTag, type StatusTagState } from '~/components/status-tag'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import {
  PODCAST_ACTION_LABELS,
  type PodcastMenuItem,
} from '../../../../utils/podcast-actions'
import styles from './_styles.module.css'

type Props = {
  podcast: {
    id: string
    title: string
    slug: string
    state: ContentState
    authorName: string
    publishedDate: string | null
    description: string
    cover: ImageSources | null
  }
  tagState: StatusTagState
  menu: PodcastMenuItem[]
  canEdit: boolean
  canCreateEpisode: boolean
  isSubmitting: boolean
  onMenuItem: (item: PodcastMenuItem) => void
}

/**
 * The podcast's header over its episode table (design 27b): the cover, the
 * title with its state, the author · publish date · address, the description,
 * and „⋯“ (Historie first), *Zobrazit na webu* on a published podcast,
 * *Upravit* on a draft and *Nová epizoda*.
 */
export const PodcastHeader = ({
  podcast,
  tagState,
  menu,
  canEdit,
  canCreateEpisode,
  isSubmitting,
  onMenuItem,
}: Props) => {
  const publicPath = href('/podcasts/:podcastSlug', {
    podcastSlug: podcast.slug,
  })
  const meta = [
    podcast.authorName,
    podcast.publishedDate === null
      ? null
      : `publikováno ${podcast.publishedDate}`,
    publicPath,
  ].filter((part) => part !== null)

  return (
    <header className={styles.header}>
      {podcast.cover === null ? (
        <div className={styles.coverMissing} />
      ) : (
        <Image {...podcast.cover} className={styles.cover} sizes={'112px'} />
      )}

      <div className={styles.text}>
        <div className={styles.titleLine}>
          <PageTitle>{podcast.title}</PageTitle>
          <StatusTag state={tagState} />
        </div>
        <span className={styles.meta}>{meta.join(' · ')}</span>
        {podcast.description !== '' && (
          <p className={styles.description}>{podcast.description}</p>
        )}
      </div>

      <div className={styles.actions}>
        <ActionMenu
          items={menu.map((item) => ({
            danger: item === 'delete',
            label: PODCAST_ACTION_LABELS[item],
            onSelect: () => onMenuItem(item),
          }))}
          label={`Další akce s podcastem ${podcast.title}`}
        />
        {podcast.state === 'published' && (
          <LinkButton
            rel={'noopener'}
            target={'_blank'}
            to={publicPath}
            variant={'outline'}
          >
            {PODCAST_ACTION_LABELS['view-on-web']}
          </LinkButton>
        )}
        {canEdit && (
          <LinkButton
            disabled={isSubmitting}
            to={href('/administration/podcasts/:podcastId/edit-podcast', {
              podcastId: podcast.id,
            })}
            variant={'outline'}
          >
            {PODCAST_ACTION_LABELS.edit}
          </LinkButton>
        )}
        {canCreateEpisode && (
          <LinkButton
            to={href(
              '/administration/podcasts/:podcastId/episodes/add-episode',
              {
                podcastId: podcast.id,
              },
            )}
          >
            Nová epizoda
          </LinkButton>
        )}
      </div>
    </header>
  )
}
