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
  TableNameCell,
  TableNameNote,
  TableRow,
  TableRowActions,
  TableRowLink,
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

import { EpisodePublishDialog } from '../../../episodes/components/episode-publish-dialog'
import {
  EpisodeStateDialog,
  type EpisodeStateDialogKind,
} from '../../../episodes/components/episode-state-dialog'
import {
  EPISODE_ACTION_LABELS,
  EPISODE_DIRECT_INTENTS,
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
 * with the rest in „⋯“, as the article's row (22a).
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
  const title = `#${episode.number} ${episode.title}`

  const fetcherKey = `episode-row-${id}`
  const fetcher = useFetcher({ key: fetcherKey })
  const isSubmitting = fetcher.state !== 'idle'
  const authenticityToken = useAuthenticityToken()
  const navigate = useNavigate()
  useContentActionResult(fetcher.data)

  const [stateDialog, setStateDialog] = useState<EpisodeStateDialogKind | null>(
    null,
  )
  const [publishDialog, setPublishDialog] = useState<{
    isApproval: boolean
  } | null>(null)

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
      case 'delete':
        return openDeleteDialog()
      case 'edit':
        return navigate(editHref)
      case 'view-on-web':
        return window.open(
          href('/podcasts/:podcastSlug/:episodeSlug', {
            episodeSlug: episode.slug,
            podcastSlug,
          }),
          '_blank',
          'noopener',
        )
    }
  }

  const rowAction = episode.row

  return (
    <TableRow muted={episode.state === 'archived'}>
      <TableSelectionCell
        checked={selected}
        disabled={!episode.canDelete}
        label={`Vybrat epizodu ${title}`}
        onChange={onSelect}
      />
      <TableCell>
        <span className={styles.number}>#{episode.number}</span>
      </TableCell>
      <TableNameCell>
        <TableRowLink className={styles.link} to={action}>
          {episode.title}
        </TableRowLink>
        {/* Without a link, the episode can't be heard on the web (27b). */}
        <TableNameNote>
          {episode.linkLabels.length === 0
            ? 'odkazy zatím chybí'
            : episode.linkLabels.join(' · ')}
        </TableNameNote>
      </TableNameCell>
      <TableCell>
        {episode.publishedAt === null || episode.state !== 'published'
          ? '—'
          : formatNumericDate(new Date(episode.publishedAt))}
      </TableCell>
      <TableStateCell>
        <StatusTag
          detail={episode.factLine ?? undefined}
          state={episode.submission ?? episode.state}
        />
      </TableStateCell>
      <TableActionsCell>
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
              items={episode.menu.map((menuAction) => ({
                danger: menuAction === 'delete',
                label: EPISODE_ACTION_LABELS[menuAction],
                onSelect: () => runAction(menuAction),
              }))}
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
          {publishDialog !== null && (
            <EpisodePublishDialog
              action={action}
              authorName={episode.authorName}
              episodeTitle={title}
              fetcherKey={fetcherKey}
              isApproval={publishDialog.isApproval}
              onClose={() => setPublishDialog(null)}
              originalPublishedAt={episode.publishedAt}
            />
          )}
        </div>
      </TableActionsCell>
    </TableRow>
  )
}
