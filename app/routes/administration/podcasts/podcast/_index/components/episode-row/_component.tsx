import { useRef, useState } from 'react'
import { href, useFetcher, useNavigate } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin/admin-delete-confirmation-dialog'
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
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { Button } from '~/components/button'
import { LinkButton } from '~/components/link-button'
import { StatusTag } from '~/components/status-tag'
import { FORM_CONFIG } from '~/config/form-config'
import { useContentActionResult } from '~/hooks/use-content-action-result'
import { formatNumericDate } from '~/utils/format-numeric-date'
import { formatEpisodeTitle } from '~/utils/podcast-episode/format-episode-title'
import { getEpisodeDisplayTitle } from '~/utils/podcast-episode/get-episode-display-title'

import { ArticleChangeDateDialog } from '../../../../../articles/components/article-change-date-dialog'
import { EpisodeMissingDialog } from '../../../episodes/components/episode-missing-dialog'
import { EpisodePublishDialog } from '../../../episodes/components/episode-publish-dialog'
import {
  EpisodeStateDialog,
  type EpisodeStateDialogKind,
} from '../../../episodes/components/episode-state-dialog'
import {
  EPISODE_ACTION_LABELS,
  EPISODE_CHANGE_DATE_DESCRIPTION,
  EPISODE_DIRECT_INTENTS,
  EPISODE_HEADER_SENTENCES,
  type EpisodeAction,
} from '../../../episodes/utils/episode-actions'
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
}

/**
 * A row of a podcast's episode table (design 27b): the number, the title
 * opening the episode over its platforms (or that the links are missing), the
 * publish date, the state tag with its author and one fact, and one action
 * with the rest in „⋯“, as the article's row (22a). Below 768 px it folds
 * into the number before the title, the state and the platforms, with „⋯“
 * holding the row action first and no publish date (32d).
 */
export const EpisodeRow = ({
  episode,
  podcastId,
  podcastSlug,
  isApprover,
  selected,
  onSelect,
}: Props) => {
  const { id } = episode
  const action = href(
    '/administration/podcasts/:podcastId/episodes/:episodeId',
    {
      episodeId: id,
      podcastId,
    },
  )
  const editHref = href(
    '/administration/podcasts/:podcastId/episodes/:episodeId/edit-episode',
    { episodeId: id, podcastId },
  )
  const title = formatEpisodeTitle(episode)

  const fetcherKey = `episode-row-${id}`
  const fetcher = useFetcher({ key: fetcherKey })
  const isSubmitting = fetcher.state !== 'idle'
  const authenticityToken = useAuthenticityToken()
  const navigate = useNavigate()
  const { closeMissingList, missingList } = useContentActionResult(
    fetcher.data,
    { heldSubject: 'epizodu' },
  )

  const [stateDialog, setStateDialog] = useState<EpisodeStateDialogKind | null>(
    null,
  )
  const [publishDialog, setPublishDialog] = useState<{
    isApproval: boolean
  } | null>(null)
  const [isChangeDateOpen, setIsChangeDateOpen] = useState(false)

  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const { openDialog: openDeleteDialog } = useAdminDeleteConfirmationDialog(
    deleteDialogRef,
    { action, key: fetcherKey },
  )

  const runAction = (episodeAction: EpisodeAction) => {
    const intent = EPISODE_DIRECT_INTENTS[episodeAction]

    if (intent !== undefined) {
      const formData = new FormData()
      formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
      formData.append(FORM_CONFIG.intent.name, intent)
      void fetcher.submit(formData, { action, method: 'POST' })
      return
    }

    switch (episodeAction) {
      case 'approve-and-publish':
        return setPublishDialog({ isApproval: true })
      case 'publish':
        return setPublishDialog({ isApproval: false })
      case 'retract':
      case 'archive':
        return setStateDialog(episodeAction)
      case 'change-date':
        return setIsChangeDateOpen(true)
      case 'delete':
        return openDeleteDialog()
      case 'edit':
        return navigate(editHref)
      case 'view-on-web':
        // Only a published address is unique: the id says which draft to
        // show (log 0039).
        return window.open(
          `${href('/podcasts/:podcastSlug/:episodeSlug', {
            episodeSlug: episode.slug,
            podcastSlug,
          })}?id=${id}`,
          '_blank',
          'noopener',
        )
    }
  }

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
    <TableRow muted={episode.state === 'archived'}>
      <TableSelectionCell
        checked={selected}
        disabled={!episode.canDelete}
        label={`Vybrat epizodu ${title}`}
        onChange={onSelect}
      />
      <TableCell>
        {episode.number !== null && (
          <span className={styles.number}>#{episode.number}</span>
        )}
      </TableCell>
      <TableNameCell>
        <TableRowLink className={styles.link} to={action}>
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
          detail={episode.factLine ?? undefined}
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
          {episode.menu.includes('delete') && (
            <AdminDeleteConfirmationDialog
              description={'Smazání je nevratné.'}
              ref={deleteDialogRef}
              subject={title}
              title={
                episode.state === 'archived'
                  ? 'Smazat archivovanou epizodu?'
                  : 'Smazat koncept?'
              }
            />
          )}
          {stateDialog !== null && (
            <EpisodeStateDialog
              action={action}
              episodeTitle={title}
              fetcherKey={fetcherKey}
              isApprover={isApprover}
              kind={stateDialog}
              onClose={() => setStateDialog(null)}
            />
          )}
          {missingList !== null && (
            <EpisodeMissingDialog
              editHref={editHref}
              missingList={missingList}
              onClose={closeMissingList}
            />
          )}
          {publishDialog !== null && (
            <EpisodePublishDialog
              action={action}
              authorName={episode.authorName}
              episodeTitle={title}
              fetcherKey={fetcherKey}
              isApproval={publishDialog.isApproval}
              note={
                episode.isNotSubmitted
                  ? EPISODE_HEADER_SENTENCES['not-submitted']
                  : null
              }
              onClose={() => setPublishDialog(null)}
              originalPublishedAt={episode.publishedAt}
            />
          )}
          {isChangeDateOpen && (
            <ArticleChangeDateDialog
              action={action}
              description={EPISODE_CHANGE_DATE_DESCRIPTION}
              fetcherKey={fetcherKey}
              onClose={() => setIsChangeDateOpen(false)}
              publishedAt={episode.publishedAt}
              title={title}
            />
          )}
        </div>
      </TableActionsCell>
    </TableRow>
  )
}
