import { clsx } from 'clsx'
import { href } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
import {
  TableActionsCell,
  TableCell,
  TableImageCell,
  TableNameAddress,
  TableNameCell,
  TableRow,
  TableRowActions,
  TableRowLink,
  TableSelectionCell,
  TableStateCell,
} from '~/components/admin/admin-table'
import { Image } from '~/components/image'
import { StatusTag } from '~/components/status-tag'

import { PodcastActionDialogs } from '../../../components/podcast-action-dialogs'
import { PODCAST_ACTION_LABELS } from '../../../utils/podcast-actions'
import { usePodcastActions } from '../../../utils/use-podcast-actions'
import type { Route } from '../../+types/route'
import styles from './_styles.module.css'

type Podcast = Route.ComponentProps['loaderData']['podcasts'][number]

type Props = {
  podcast: Podcast
  selected: boolean
  onSelect: () => void
}

/**
 * A row of the podcast list (design 27a): the square cover, the name opening
 * the podcast's page over its address, the episodes on the web with what is
 * in progress or the latest one's date, the state tag with one fact, and
 * every action in „⋯“ — the row has no main action, Nová epizoda belongs on
 * the podcast's page.
 */
export const ItemRow = ({ podcast, selected, onSelect }: Props) => {
  const actions = usePodcastActions({
    deleteRedirects: false,
    fetcherKey: `podcast-row-${podcast.id}`,
    podcast,
  })

  return (
    <TableRow muted={podcast.state === 'archived'}>
      <TableSelectionCell
        checked={selected}
        disabled={!podcast.canSelect}
        label={`Vybrat podcast ${podcast.title}`}
        onChange={onSelect}
      />
      <TableImageCell>
        {/* Square, as the platforms want it (27a). */}
        {podcast.cover === null ? (
          <div className={styles.coverMissing} />
        ) : (
          <Image {...podcast.cover} className={styles.cover} sizes={'44px'} />
        )}
      </TableImageCell>
      <TableNameCell>
        <TableRowLink
          className={styles.link}
          to={href('/administration/podcasts/:podcastId', {
            podcastId: podcast.id,
          })}
        >
          {podcast.title}
        </TableRowLink>
        <TableNameAddress>
          {podcast.cover === null
            ? 'obálka zatím chybí'
            : href('/podcasts/:podcastSlug', { podcastSlug: podcast.slug })}
        </TableNameAddress>
      </TableNameCell>
      <TableCell>
        <span className={styles.episodes}>
          {podcast.episodeLines.count}
          {podcast.episodeLines.detail !== null && (
            <span
              className={clsx(
                styles.detail,
                podcast.episodeLines.isPending && styles.pending,
              )}
            >
              {podcast.episodeLines.detail}
            </span>
          )}
        </span>
      </TableCell>
      <TableStateCell>
        <StatusTag
          detail={podcast.factLine ?? undefined}
          state={podcast.submission ?? podcast.state}
        />
      </TableStateCell>
      <TableActionsCell>
        <TableRowActions>
          {podcast.actions.length > 0 && (
            <ActionMenu
              items={podcast.actions.map((action) => ({
                danger: action === 'delete',
                label: PODCAST_ACTION_LABELS[action],
                onSelect: () => actions.runAction(action),
              }))}
              label={`Další akce s podcastem ${podcast.title}`}
              size={'sm'}
            />
          )}
        </TableRowActions>

        {/* The cell aligns right and doesn't wrap; its dialogs shouldn't inherit that. */}
        <div className={styles.dialogs}>
          <PodcastActionDialogs
            actions={actions}
            canDelete={podcast.actions.includes('delete')}
            linksEpisodes={true}
          />
        </div>
      </TableActionsCell>
    </TableRow>
  )
}
