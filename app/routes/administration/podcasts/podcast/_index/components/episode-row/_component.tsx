import { ActionMenu } from '~/components/action-menu'
import {
  TableActionsCell,
  TableCell,
  TableDetailsCell,
  TableDetailsLine,
  TableNameAddress,
  TableNameCell,
  TableRow,
  TableRowActions,
  TableRowLink,
  TableRowMenu,
  TableSelectionCell,
  TableStateCell,
} from '~/components/admin/admin-table'
import { Button } from '~/components/button'
import { LinkButton } from '~/components/link-button'
import { StatusTag } from '~/components/status-tag'
import type { LiveChange } from '~/hooks/use-live-changes'
import { formatNumericDate } from '~/utils/format-numeric-date'
import { getLiveStateDetail } from '~/utils/live-change/get-live-state-detail'
import { getRowTint } from '~/utils/live-change/get-row-tint'
import { formatEpisodeTitle } from '~/utils/podcast-episode/format-episode-title'
import { getEpisodeDisplayTitle } from '~/utils/podcast-episode/get-episode-display-title'

import { EpisodeActionDialogs } from '../../../episodes/components/episode-action-dialogs'
import {
  EPISODE_ACTION_LABELS,
  type EpisodeAction,
} from '../../../episodes/utils/episode-actions'
import { useEpisodeActions } from '../../../episodes/utils/use-episode-actions'
import type { Route } from '../../+types/route'
import styles from './_styles.module.css'

type Episode =
  Route.ComponentProps['loaderData']['episodeTable']['episodes'][number]

type Props = {
  episode: Episode
  podcastId: string
  podcastSlug: string
  isApprover: boolean
  selected: boolean
  onSelect: () => void
  liveChange?: LiveChange
}

/**
 * A row of a podcast's episode table (design 27b): the number, the title
 * opening the episode over its platforms (or that the links are missing), the
 * publish date, the state tag with its author and one fact, and one action
 * with the rest in „⋯“, as the article's row (22a). Below 768 px it folds
 * into the number before the title, the state and the platforms, with „⋯“
 * holding the row action first and no publish date (32d). While someone else
 * edits it, the row says who; one someone else changed while the page is open
 * is tinted for a moment and says who changed it (22f, xkg6rdz4).
 */
export const EpisodeRow = ({
  episode,
  podcastId,
  podcastSlug,
  isApprover,
  selected,
  onSelect,
  liveChange,
}: Props) => {
  const title = formatEpisodeTitle(episode)
  const actions = useEpisodeActions({
    episode,
    fetcherKey: `episode-row-${episode.id}`,
    podcast: { id: podcastId, slug: podcastSlug },
  })
  const { detailHref, editHref, isSubmitting, runAction } = actions

  const rowAction = episode.row
  const toMenuItem = (menuAction: EpisodeAction) => ({
    danger: menuAction === 'delete',
    label: EPISODE_ACTION_LABELS[menuAction],
    onSelect: () => runAction(menuAction),
  })
  // On a phone „⋯“ stands alone, the row action first in it (32d).
  const phoneMenu =
    rowAction === null ? episode.menu : [rowAction, ...episode.menu]
  // Without a link, the episode can't be heard on the web (27b).
  const platforms =
    episode.linkLabels.length === 0
      ? 'odkazy zatím chybí'
      : episode.linkLabels.join(' · ')

  return (
    <TableRow
      muted={episode.state === 'archived'}
      tint={getRowTint(liveChange)}
    >
      <TableSelectionCell
        checked={selected}
        disabled={!episode.isSelectable}
        label={`Vybrat epizodu ${title}`}
        onChange={onSelect}
      />
      <TableCell>
        {episode.number !== null && (
          <span className={styles.number}>#{episode.number}</span>
        )}
      </TableCell>
      <TableNameCell>
        <TableRowLink className={styles.link} to={detailHref}>
          {/* A phone has no Číslo column: the number leads the title (32d). */}
          {episode.number !== null && (
            <span className={styles.phoneNumber}>#{episode.number} </span>
          )}
          {getEpisodeDisplayTitle(episode.title)}
        </TableRowLink>
        {/* Under the title on a wide screen; a phone moves it to the third
            line, under the state (32d). */}
        <TableNameAddress>{platforms}</TableNameAddress>
      </TableNameCell>
      {/* A draft has none yet; an archived one keeps its date (27b). */}
      <TableCell className={styles.date}>
        {episode.publishedAt === null || episode.state === 'draft'
          ? '—'
          : formatNumericDate(new Date(episode.publishedAt))}
      </TableCell>
      <TableStateCell>
        <StatusTag
          // Who edits it comes first: it changes what the row allows (27b).
          detail={getLiveStateDetail({
            factLine: episode.factLine,
            holdLine: episode.holdLine,
            liveChange,
            now: new Date(),
          })}
          state={episode.submission ?? episode.state}
        />
      </TableStateCell>
      <TableDetailsCell>
        <TableDetailsLine>{platforms}</TableDetailsLine>
      </TableDetailsCell>
      <TableActionsCell>
        {phoneMenu.length > 0 && (
          <TableRowMenu phoneOnly={true}>
            <ActionMenu
              items={phoneMenu.map(toMenuItem)}
              label={`Další akce s epizodou ${title}`}
              size={'sm'}
            />
          </TableRowMenu>
        )}
        <TableRowActions>
          {rowAction === 'edit' && (
            <LinkButton
              disabled={isSubmitting}
              size={'sm'}
              to={editHref}
              variant={'outline'}
            >
              {EPISODE_ACTION_LABELS.edit}
            </LinkButton>
          )}
          {rowAction !== null && rowAction !== 'edit' && (
            <Button
              disabled={isSubmitting}
              onClick={() => runAction(rowAction)}
              size={'sm'}
              type={'button'}
              variant={'outline'}
            >
              {EPISODE_ACTION_LABELS[rowAction]}
            </Button>
          )}
          {episode.menu.length > 0 && (
            <ActionMenu
              items={episode.menu.map(toMenuItem)}
              label={`Další akce s epizodou ${title}`}
              size={'sm'}
            />
          )}
        </TableRowActions>

        {/* The cell aligns right and doesn't wrap; its dialogs shouldn't inherit that. */}
        <div className={styles.dialogs}>
          <EpisodeActionDialogs
            actions={actions}
            canDelete={episode.menu.includes('delete')}
            episode={{ ...episode, title }}
            isApprover={isApprover}
          />
        </div>
      </TableActionsCell>
    </TableRow>
  )
}
