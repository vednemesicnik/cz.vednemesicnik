// noinspection JSUnusedGlobalSymbols

import { clsx } from 'clsx'
import { useRef, useState } from 'react'
import { href, useFetcher, useNavigate } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin/admin-delete-confirmation-dialog'
import { AdminDetailAside } from '~/components/admin/admin-detail-aside'
import { AdminDetailItem } from '~/components/admin/admin-detail-item'
import { AdminDetailLayout } from '~/components/admin/admin-detail-layout'
import { AdminDetailList } from '~/components/admin/admin-detail-list'
import { AdminDetailMain } from '~/components/admin/admin-detail-main'
import { AdminDetailSection } from '~/components/admin/admin-detail-section'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminParagraph } from '~/components/admin/admin-paragraph'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { Button } from '~/components/button'
import { HistoryList } from '~/components/history-list'
import { Hyperlink } from '~/components/hyperlink'
import { Image } from '~/components/image'
import { Link } from '~/components/link'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import { StatusTag } from '~/components/status-tag'
import { useToast } from '~/components/toast-provider'
import { FORM_CONFIG } from '~/config/form-config'
import { useAdminNoticeToast } from '~/hooks/use-admin-notice-toast'
import { useContentActionResult } from '~/hooks/use-content-action-result'
import { useContentEvents } from '~/hooks/use-content-events'
import { useRevalidateAt } from '~/hooks/use-revalidate-at'
import { getOwnOtherTabDeleteRefusal } from '~/utils/edit-hold/get-own-other-tab-delete-refusal'
import { formatEpisodeTitle } from '~/utils/podcast-episode/format-episode-title'
import { getEpisodeDisplayTitle } from '~/utils/podcast-episode/get-episode-display-title'

import { ArticleChangeDateDialog } from '../../../../../articles/components/article-change-date-dialog'
import { EpisodeMissingDialog } from '../../components/episode-missing-dialog'
import { EpisodePublishDialog } from '../../components/episode-publish-dialog'
import {
  EpisodeStateDialog,
  type EpisodeStateDialogKind,
} from '../../components/episode-state-dialog'
import {
  EPISODE_ACTION_LABELS,
  EPISODE_CHANGE_DATE_DESCRIPTION,
  EPISODE_DIRECT_INTENTS,
  EPISODE_HEADER_SENTENCES,
  EPISODE_SUBMISSION_NOTES,
  type EpisodeAction,
} from '../../utils/episode-actions'
import type { action as episodeAction } from './_action'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { EpisodeLinkCard } from './components/episode-link-card'
import { EpisodeLinkList } from './components/episode-link-list'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const {
    episode,
    headerActions,
    heldByName,
    heldUntil,
    isApprover,
    isHeldInOwnOtherTab,
    isOnWeb,
    isOwnContent,
    missingBeforePublish,
    podcastUnpublished,
    submission,
  } = loaderData
  const { podcastId, episodeId } = params

  useContentEvents({
    filter: (event) =>
      event.entity === 'podcast_episode' && event.entityId === episodeId,
  })
  // An edit hold's expiry sends no event; the page looks again then (27c, 07g).
  useRevalidateAt([heldUntil])
  // „Epizodu právě upravuje …“ after a direct address of its editor (27c).
  useAdminNoticeToast(loaderData)

  const fetcherKey = `episode-action-${episodeId}`
  const fetcher = useFetcher<typeof episodeAction>({ key: fetcherKey })
  const authenticityToken = useAuthenticityToken()
  const navigate = useNavigate()
  const showToast = useToast()
  const { closeMissingList, missingList, showMissingList } =
    useContentActionResult(fetcher.data, { heldSubject: 'epizodu' })

  const [stateDialog, setStateDialog] = useState<EpisodeStateDialogKind | null>(
    null,
  )
  const [publishDialog, setPublishDialog] = useState<{
    isApproval: boolean
  } | null>(null)
  const [isChangeDateOpen, setIsChangeDateOpen] = useState(false)

  const isSubmitting = fetcher.state !== 'idle'
  const title = formatEpisodeTitle(episode)

  const detailHref = href(
    '/administration/podcasts/:podcastId/episodes/:episodeId',
    { episodeId, podcastId },
  )
  const editHref = href(
    '/administration/podcasts/:podcastId/episodes/:episodeId/edit-episode',
    { episodeId, podcastId },
  )
  const podcastHref = href('/administration/podcasts/:podcastId', {
    podcastId,
  })
  // A draft without an address has no page on the web yet (log 0020).
  const webPath =
    episode.slug === ''
      ? null
      : href('/podcasts/:podcastSlug/:episodeSlug', {
          episodeSlug: episode.slug,
          podcastSlug: episode.podcast.slug,
        })
  // Only a published address is unique: the id says which draft to show (log 0039).
  const previewPath = webPath === null ? null : `${webPath}?id=${episodeId}`

  const deleteConfirmationDialogRef = useRef<HTMLDialogElement>(null)

  const { openDialog } = useAdminDeleteConfirmationDialog(
    deleteConfirmationDialogRef,
    { action: detailHref, key: fetcherKey, withRedirect: true },
  )

  // An incomplete episode opens the 27h list instead of the date dialog.
  const openPublishDialog = (isApproval: boolean) => {
    if (missingBeforePublish.length > 0) {
      showMissingList({
        intent: INTENT_VALUE.publish,
        items: missingBeforePublish,
      })
      return
    }

    setPublishDialog({ isApproval })
  }

  const runAction = (headerAction: EpisodeAction) => {
    const intent = EPISODE_DIRECT_INTENTS[headerAction]

    if (intent !== undefined) {
      const formData = new FormData()
      formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
      formData.append(INTENT_NAME, intent)
      void fetcher.submit(formData, { method: 'POST' })
      return
    }

    switch (headerAction) {
      case 'approve-and-publish':
        return openPublishDialog(true)
      case 'publish':
        return openPublishDialog(false)
      case 'retract':
      case 'archive':
        return setStateDialog(headerAction)
      case 'change-date':
        return setIsChangeDateOpen(true)
      case 'delete':
        // One's own editor in another tab: the delete waits, without asking
        // first (23g, 27c; 0036). The server refuses it again in its write.
        if (isHeldInOwnOtherTab)
          return showToast(getOwnOtherTabDeleteRefusal('episode'))
        return openDialog()
      case 'edit':
      case 'take-over':
        return navigate(editHref)
      case 'view-on-web':
        if (webPath !== null) window.open(webPath, '_blank', 'noopener')
        return
    }
  }

  const renderButton = (
    headerAction: EpisodeAction,
    variant: 'primary' | 'outline',
  ) => {
    switch (headerAction) {
      // Taking over opens the editor, which asks first (24g).
      case 'edit':
      case 'take-over':
        return (
          <LinkButton disabled={isSubmitting} to={editHref} variant={'outline'}>
            {EPISODE_ACTION_LABELS[headerAction]}
          </LinkButton>
        )
      case 'view-on-web':
        return (
          webPath !== null && (
            <LinkButton
              rel={'noopener'}
              target={'_blank'}
              to={webPath}
              variant={'outline'}
            >
              {EPISODE_ACTION_LABELS['view-on-web']}
            </LinkButton>
          )
        )
      default:
        return (
          <Button
            disabled={isSubmitting}
            onClick={() => runAction(headerAction)}
            type={'button'}
            variant={variant}
          >
            {EPISODE_ACTION_LABELS[headerAction]}
          </Button>
        )
    }
  }

  // The podcast by name, a link to its page, in 27f's first sentence.
  const podcastLead = `Podcast ${episode.podcast.title}`

  return (
    <AdminPage measure={'text'}>
      <header className={styles.header}>
        <div className={styles.title}>
          <div className={styles.titleLine}>
            {/* The number in grey before the title, as on the web (27c). */}
            <PageTitle>
              {episode.number !== null && (
                <span className={styles.number}>#{episode.number} </span>
              )}
              {getEpisodeDisplayTitle(episode.title)}
            </PageTitle>
            <StatusTag state={submission ?? episode.state} />
          </div>
          <span className={styles.subtitle}>
            {episode.authorName} · {episode.factLine}
          </span>
        </div>

        {/* One primary, one outline, the rest in „⋯“; where the role may do nothing, who can (07c). */}
        <div className={styles.actions}>
          {/* Someone else edits it: who, in place of the buttons (27c, 07g). */}
          {heldByName !== null && (
            <p className={styles.sentence}>
              Epizodu právě upravuje {heldByName}.
            </p>
          )}
          {/* The podcast is off the web: why, in place of submit and publish (27f). */}
          {podcastUnpublished !== null && podcastUnpublished.item !== null && (
            <p className={styles.sentence}>
              Podcast <Link to={podcastHref}>{episode.podcast.title}</Link>
              {podcastUnpublished.item.slice(podcastLead.length)}{' '}
              {podcastUnpublished.advice}
            </p>
          )}
          {headerActions.sentence !== null && (
            <p className={styles.sentence}>
              {EPISODE_HEADER_SENTENCES[headerActions.sentence]}
            </p>
          )}
          <ActionMenu
            items={headerActions.menu.map((headerAction) => ({
              danger: headerAction === 'delete',
              label: EPISODE_ACTION_LABELS[headerAction],
              onSelect: () => runAction(headerAction),
            }))}
          />
          {headerActions.outline !== null &&
            renderButton(headerActions.outline, 'outline')}
          {headerActions.primary !== null &&
            renderButton(headerActions.primary, 'primary')}
        </div>
      </header>

      {isOwnContent && submission !== null && (
        <AdminParagraph>{EPISODE_SUBMISSION_NOTES[submission]}</AdminParagraph>
      )}

      {/* The description and the links on the left, the details beside them (27c, as 23a). */}
      <AdminDetailLayout>
        <AdminDetailMain>
          <div className={styles.content}>
            {episode.description !== '' && (
              <p className={styles.description}>{episode.description}</p>
            )}

            <section className={styles.links}>
              <h2 className={styles.linksHeading}>Odkazy na epizodu</h2>
              {episode.links.length === 0 ? (
                <p className={styles.tertiary}>odkazy zatím chybí</p>
              ) : (
                // In the order the web lists them (27c).
                <EpisodeLinkList>
                  {episode.links.map((link) => (
                    <EpisodeLinkCard
                      isValid={link.isValid}
                      key={link.id}
                      platform={link.label}
                      url={link.url}
                    />
                  ))}
                </EpisodeLinkList>
              )}
            </section>
          </div>
        </AdminDetailMain>

        <AdminDetailAside>
          <AdminDetailSection title={'Údaje'}>
            <AdminDetailList>
              <AdminDetailItem label={'Podcast'}>
                <Link to={podcastHref}>{episode.podcast.title}</Link>
              </AdminDetailItem>
              <AdminDetailItem label={'Číslo'}>
                {episode.number ?? '—'}
              </AdminDetailItem>
              <AdminDetailItem label={'Obálka'}>
                {/* Without its own cover, the podcast's, muted (5hl7vx3a). */}
                <div className={styles.cover}>
                  {episode.cover === null ? (
                    <div
                      className={clsx(
                        styles.coverImage,
                        styles.coverMissing,
                        styles.muted,
                      )}
                    />
                  ) : (
                    <Image
                      {...episode.cover.sources}
                      alt={episode.cover.altText}
                      className={clsx(
                        styles.coverImage,
                        !episode.cover.isOwn && styles.muted,
                      )}
                      sizes={'28px'}
                    />
                  )}
                  {episode.cover?.isOwn !== true && (
                    <span className={styles.tertiary}>z podcastu</span>
                  )}
                </div>
              </AdminDetailItem>
              <AdminDetailItem label={'Adresa'}>
                {webPath === null ? (
                  '—'
                ) : episode.state !== 'published' &&
                  isOnWeb &&
                  previewPath !== null ? (
                  <span className={styles.stack}>
                    <Hyperlink
                      href={previewPath}
                      rel={'noopener'}
                      target={'_blank'}
                    >
                      Náhled na webu
                    </Hyperlink>
                    <span className={styles.tertiary}>{webPath}</span>
                  </span>
                ) : (
                  <span className={styles.tertiary}>{webPath}</span>
                )}
              </AdminDetailItem>
              <AdminDetailItem label={'Autor'}>
                {episode.authorName}
              </AdminDetailItem>
            </AdminDetailList>
          </AdminDetailSection>

          <AdminDetailSection title={'Historie'}>
            <HistoryList
              entries={episode.history.entries}
              isIncomplete={episode.history.isIncomplete}
              // A reused route component starts every record collapsed.
              key={episode.id}
              visibleCount={5}
            />
          </AdminDetailSection>
        </AdminDetailAside>
      </AdminDetailLayout>

      <AdminDeleteConfirmationDialog
        description={'Smazání je nevratné.'}
        ref={deleteConfirmationDialogRef}
        subject={title}
        title={
          episode.state === 'archived'
            ? 'Smazat archivovanou epizodu?'
            : 'Smazat koncept?'
        }
      />

      {missingList !== null && (
        <EpisodeMissingDialog
          editHref={editHref}
          missingList={missingList}
          onClose={closeMissingList}
        />
      )}

      {stateDialog !== null && (
        <EpisodeStateDialog
          action={detailHref}
          episodeTitle={title}
          fetcherKey={fetcherKey}
          isApprover={isApprover}
          kind={stateDialog}
          onClose={() => setStateDialog(null)}
        />
      )}

      {publishDialog !== null && (
        <EpisodePublishDialog
          action={detailHref}
          authorName={episode.authorName}
          episodeTitle={title}
          fetcherKey={fetcherKey}
          isApproval={publishDialog.isApproval}
          onClose={() => setPublishDialog(null)}
          originalPublishedAt={episode.publishedAt}
        />
      )}

      {isChangeDateOpen && (
        <ArticleChangeDateDialog
          action={detailHref}
          description={EPISODE_CHANGE_DATE_DESCRIPTION}
          fetcherKey={fetcherKey}
          onClose={() => setIsChangeDateOpen(false)}
          publishedAt={episode.publishedAt}
          title={title}
        />
      )}
    </AdminPage>
  )
}
