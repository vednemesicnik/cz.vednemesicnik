import type { ContentState } from '@generated/prisma/enums'
import { href } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
import { Button } from '~/components/button'
import { Image } from '~/components/image'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import { StatusTag, type StatusTagState } from '~/components/status-tag'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import {
  PODCAST_ACTION_LABELS,
  type PodcastAction,
  type PodcastMenuItem,
} from '../../../../utils/podcast-actions'
import { NewEpisodeButton } from '../new-episode-button'
import styles from './_styles.module.css'

type Props = {
  podcast: {
    id: string
    title: string
    slug: string
    state: ContentState
    authorName: string
    publishedDate: string | null
    /** Who edits it while held: „upravuje Jakub Novák od 14:02“ (23g). */
    holdLine: string | null
    description: string
    cover: ImageSources | null
  }
  tagState: StatusTagState
  headerActions: {
    primary: PodcastAction | null
    outline: PodcastAction | null
    menu: PodcastMenuItem[]
  }
  canCreateEpisode: boolean
  isSubmitting: boolean
  /** Who else edits the podcast right now, said beside the buttons (07g). */
  heldByName: string | null
  onMenuItem: (item: PodcastMenuItem) => void
}

/**
 * The podcast's header over its episode table (design 27b, 27i): the cover,
 * the title with its state, the author · publish date or who edits it ·
 * address, the description, and „⋯“ (Historie first), the outline action,
 * *Nová epizoda* and the primary action. *Nová epizoda* is the primary where
 * the state has none, and on a phone waits in the page's `ListActionBar`
 * instead (32d).
 */
export const PodcastHeader = ({
  podcast,
  tagState,
  headerActions,
  canCreateEpisode,
  isSubmitting,
  heldByName,
  onMenuItem,
}: Props) => {
  const publicPath = href('/podcasts/:podcastSlug', {
    podcastSlug: podcast.slug,
  })
  const renderAction = (
    action: PodcastAction,
    variant: 'primary' | 'outline',
  ) => {
    switch (action) {
      case 'edit':
        return (
          <LinkButton
            disabled={isSubmitting}
            to={href('/administration/podcasts/:podcastId/edit-podcast', {
              podcastId: podcast.id,
            })}
            variant={variant}
          >
            {PODCAST_ACTION_LABELS.edit}
          </LinkButton>
        )

      case 'view-on-web':
        return (
          <LinkButton
            rel={'noopener'}
            target={'_blank'}
            to={publicPath}
            variant={variant}
          >
            {PODCAST_ACTION_LABELS['view-on-web']}
          </LinkButton>
        )

      default:
        return (
          <Button
            disabled={isSubmitting}
            onClick={() => onMenuItem(action)}
            type={'button'}
            variant={variant}
          >
            {PODCAST_ACTION_LABELS[action]}
          </Button>
        )
    }
  }

  const meta = [
    podcast.authorName,
    // Only a draft is held, and it has no publish date to show (07g).
    podcast.holdLine ??
      (podcast.publishedDate === null
        ? null
        : `publikováno ${podcast.publishedDate}`),
    // A draft may have no address yet (27i).
    podcast.slug === '' ? null : publicPath,
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
        {/* Someone else edits it: who, beside what still works (07g); its
            state actions wait. */}
        {heldByName !== null && (
          <p className={styles.heldSentence}>
            Podcast právě upravuje {heldByName}.
          </p>
        )}
        <ActionMenu
          items={headerActions.menu.map((item) => ({
            danger: item === 'delete',
            label: PODCAST_ACTION_LABELS[item],
            onSelect: () => onMenuItem(item),
          }))}
          label={`Další akce s podcastem ${podcast.title}`}
        />
        {headerActions.outline !== null &&
          renderAction(headerActions.outline, 'outline')}
        {canCreateEpisode && (
          <NewEpisodeButton
            className={styles.newEpisode}
            podcastId={podcast.id}
            variant={headerActions.primary === null ? 'primary' : 'outline'}
          />
        )}
        {headerActions.primary !== null &&
          renderAction(headerActions.primary, 'primary')}
      </div>
    </header>
  )
}
