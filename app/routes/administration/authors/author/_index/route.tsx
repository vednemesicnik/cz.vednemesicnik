// noinspection JSUnusedGlobalSymbols

import { Fragment, useRef, useState } from 'react'
import { href, useNavigate } from 'react-router'

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
import { BaseLink } from '~/components/base-link'
import { HistoryList } from '~/components/history-list'
import { Link } from '~/components/link'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import { StatusTag } from '~/components/status-tag'
import { useContentEvents } from '~/hooks/use-content-events'
import { RETURN_TO_OPENER_STATE } from '~/utils/return-to-opener-state'
import { getAuthorRoleLabel } from '~/utils/role-labels'

import { AuthorAvatar } from '../../components/author-avatar'
import { AuthorDeleteBlockedDialog } from '../../components/author-delete-blocked-dialog'
import { AUTHOR_CONTENT_SECTION_ID } from '../../utils/author-content-section-id'
import { useAuthorDeleteRefusal } from '../../utils/use-author-delete-refusal'

import styles from './_styles.module.css'
import type { Route } from './+types/route'

const ITEM_TYPE_LABELS = {
  article: 'Článek',
  episode: 'Epizoda',
  issue: 'Číslo',
} as const

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const {
    author,
    canCreateUser,
    canUpdate,
    contentCounts,
    deleteBlock,
    history,
    mayDelete,
    recentContent,
  } = loaderData
  const { authorId } = params

  const navigate = useNavigate()

  // Content events carry no authors, so every change to a type the page
  // counts reloads it (log 0035).
  useContentEvents()

  const deleteConfirmationDialogRef = useRef<HTMLDialogElement>(null)
  const [isBlockedDialogOpen, setIsBlockedDialogOpen] = useState(false)
  const deleteFetcherKey = `delete-author-${authorId}`
  const { dismiss, refusal } = useAuthorDeleteRefusal(deleteFetcherKey)

  const { openDialog } = useAdminDeleteConfirmationDialog(
    deleteConfirmationDialogRef,
    {
      action: href('/administration/authors/:authorId', { authorId }),
      key: deleteFetcherKey,
      withRedirect: true,
    },
  )

  const roleLabel = getAuthorRoleLabel(author.role.name)

  return (
    <AdminPage measure={'text'}>
      <div className={styles.header}>
        <div className={styles.identity}>
          <AuthorAvatar
            image={author.image}
            isAssociation={author.isAssociation}
            name={author.name}
            size={56}
          />
          <div className={styles.title}>
            <PageTitle>{author.name}</PageTitle>
            <span className={styles.subtitle}>
              {roleLabel} · vytvořeno {author.createdAt}
            </span>
          </div>
        </div>

        {/* No primary action: an author has no state waiting on a step (28a, 28b). */}
        <div className={styles.actions}>
          <ActionMenu
            items={[
              ...(canCreateUser
                ? [
                    {
                      label: 'Založit účet…',
                      onSelect: () =>
                        navigate(
                          `${href('/administration/users/new')}?${new URLSearchParams({ author: authorId })}`,
                          { state: RETURN_TO_OPENER_STATE },
                        ),
                    },
                  ]
                : []),
              ...(mayDelete
                ? [
                    {
                      danger: true,
                      label: 'Smazat…',
                      onSelect: deleteBlock.deletable
                        ? openDialog
                        : () => setIsBlockedDialogOpen(true),
                    },
                  ]
                : []),
            ]}
            label={'Další akce s autorem'}
          />
          {canUpdate && (
            <LinkButton
              state={RETURN_TO_OPENER_STATE}
              to={href('/administration/authors/:authorId/edit', {
                authorId,
              })}
              variant={'outline'}
            >
              Upravit
            </LinkButton>
          )}
        </div>
      </div>

      {/* Left what the author stands on, right its data and history (28b). */}
      <AdminDetailLayout>
        <AdminDetailMain>
          <AdminDetailSection id={AUTHOR_CONTENT_SECTION_ID} title={'Obsah'}>
            {contentCounts.length === 0 ? (
              <p className={styles.empty}>Zatím u ničeho nestojí.</p>
            ) : (
              <>
                {/* Only the article count is a link: no other list filters by author (dksfb82t). */}
                <p className={styles.counts}>
                  {contentCounts.map((count, index) => (
                    <Fragment key={count.type}>
                      {index > 0 && <span aria-hidden>·</span>}
                      {count.type === 'articles' ? (
                        <Link
                          to={`${href('/administration/articles')}?${new URLSearchParams({ author: authorId })}`}
                        >
                          {count.label}
                        </Link>
                      ) : (
                        <span>{count.label}</span>
                      )}
                    </Fragment>
                  ))}
                </p>
                {recentContent.length > 0 && (
                  <ul className={styles.items}>
                    {recentContent.map((item) => (
                      <li className={styles.item} key={item.id}>
                        <span className={styles.type}>
                          {ITEM_TYPE_LABELS[item.type]}
                        </span>
                        <BaseLink className={styles.itemLink} to={item.href}>
                          {item.title}
                        </BaseLink>
                        <StatusTag state={item.state} />
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </AdminDetailSection>
        </AdminDetailMain>

        <AdminDetailAside>
          <AdminDetailSection title={'Údaje'}>
            <AdminDetailList>
              <AdminDetailItem label={'Autorská role'}>
                {roleLabel}
              </AdminDetailItem>
              <AdminDetailItem label={'Účet'}>
                {author.user === null ? (
                  'Bez účtu'
                ) : (
                  <Link
                    to={href('/administration/users/:userId', {
                      userId: author.user.id,
                    })}
                  >
                    {author.user.email}
                  </Link>
                )}
              </AdminDetailItem>
              <AdminDetailItem label={'Bio'}>
                {author.bio ?? '—'}
              </AdminDetailItem>
            </AdminDetailList>
          </AdminDetailSection>

          {/* An author older than the log, never changed, has none (as 28e). */}
          {history.length > 0 && (
            <AdminDetailSection title={'Historie'}>
              <HistoryList entries={history} />
            </AdminDetailSection>
          )}
        </AdminDetailAside>
      </AdminDetailLayout>

      <AdminDeleteConfirmationDialog ref={deleteConfirmationDialogRef} />

      {/* Opened from the detail, it never offers Zobrazit obsah (dksfb82t). */}
      {(isBlockedDialogOpen || refusal !== null) && (
        <AuthorDeleteBlockedDialog
          block={refusal ?? deleteBlock}
          name={author.name}
          onClose={() => {
            setIsBlockedDialogOpen(false)
            dismiss()
          }}
        />
      )}
    </AdminPage>
  )
}
