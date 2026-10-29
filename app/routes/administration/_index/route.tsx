// noinspection JSUnusedGlobalSymbols

import { Form, href } from 'react-router'

import { AdminBoundaryError } from '~/components/admin/admin-boundary-error'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminTable, TableBody } from '~/components/admin/admin-table'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { Link } from '~/components/link'
import { LinkButton } from '~/components/link-button'
import { ListActionBar } from '~/components/list-action-bar'
import { ListEmptyCard } from '~/components/list-empty-card'
import { ListEmptyCardText } from '~/components/list-empty-card-text'
import { ListEmptyCardTitle } from '~/components/list-empty-card-title'
import { ListHeader } from '~/components/list-header'
import { PageTitle } from '~/components/page-title'
import { useAdminNoticeToast } from '~/hooks/use-admin-notice-toast'
import { PUBLISH_APPROVED_STATE } from '../articles/_index/publish-approved-state'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { DashboardApprovedLine } from './components/dashboard-approved-line'
import { DashboardItemRow } from './components/dashboard-item-row'
import { DashboardSection } from './components/dashboard-section'
import { DashboardSectionEmpty } from './components/dashboard-section-empty'
import { DashboardSectionHeading } from './components/dashboard-section-heading'
import { DashboardSectionNote } from './components/dashboard-section-note'
import type { DashboardItem } from './dashboard-item'
import type { DashboardSectionKind } from './dashboard-section-kind'
import { formatApprovedLine } from './utils/format-approved-line'
import { useLiveDashboard } from './utils/use-live-dashboard'

/**
 * The administration's first screen (design 21): a queue of what waits on the
 * signed-in person, not a noticeboard. The Coordinator gets what waits for
 * approval, what waits for its order and their own drafts (21a); an author
 * follows their own content from draft to the web (21b).
 */
export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  useAdminNoticeToast(loaderData)
  const { queue, pendingCount, approved, drafts, submitted, liveChanges } =
    useLiveDashboard(loaderData)
  const { isApprover, canCreateArticle, authorId } = loaderData
  const now = new Date()

  const renderNewArticleButton = () =>
    canCreateArticle && (
      <Form
        action={href('/administration/articles/add-article')}
        method={'post'}
      >
        <AuthenticityTokenInput />
        <Button type={'submit'}>Nový článek</Button>
      </Form>
    )

  const renderRows = (
    items: DashboardItem[],
    section: DashboardSectionKind,
  ) => (
    <AdminTable>
      <TableBody>
        {items.map((item) => (
          <DashboardItemRow
            isApprover={isApprover}
            item={item}
            key={item.key}
            liveChange={liveChanges.get(item.key)}
            now={now}
            section={section}
          />
        ))}
      </TableBody>
    </AdminTable>
  )

  // Whoever has nothing yet gets one card in place of both sections (21c).
  const isEmptyForAuthor =
    !isApprover && drafts.length === 0 && submitted.length === 0

  return (
    <AdminPage>
      <ListHeader>
        <PageTitle>Přehled</PageTitle>
        {renderNewArticleButton()}
      </ListHeader>

      <div className={styles.sections}>
        {isApprover && (
          <DashboardSection>
            <DashboardSectionHeading count={pendingCount}>
              Čeká na schválení
            </DashboardSectionHeading>
            {/* An empty queue says so: the Coordinator would not tell it
                from one that failed to load (21c). */}
            {queue.length === 0 ? (
              <DashboardSectionEmpty>
                Nic nečeká na schválení.
              </DashboardSectionEmpty>
            ) : (
              renderRows(queue, 'queue')
            )}
          </DashboardSection>
        )}

        {approved.length > 0 && (
          <DashboardSection>
            <DashboardSectionHeading>K publikaci</DashboardSectionHeading>
            {approved.map((summary) => (
              <DashboardApprovedLine key={summary.type}>
                <span>
                  {formatApprovedLine({
                    count: summary.count,
                    earliestApprovedAt: new Date(summary.earliestApprovedAt),
                    type: summary.type,
                  })}
                </span>
                {summary.type === 'article' && (
                  // Opens the list with every approved article selected and
                  // the 22c dialog that orders them (21a).
                  <LinkButton
                    className={styles.wideOnly}
                    size={'sm'}
                    state={PUBLISH_APPROVED_STATE}
                    to={summary.listHref}
                    variant={'outline'}
                  >
                    Publikovat v pořadí…
                  </LinkButton>
                )}
                <LinkButton
                  className={
                    summary.type === 'article' ? styles.phoneOnly : undefined
                  }
                  size={'sm'}
                  to={summary.listHref}
                  variant={'ghost'}
                >
                  Zobrazit schválené
                </LinkButton>
              </DashboardApprovedLine>
            ))}
          </DashboardSection>
        )}

        {drafts.length > 0 && (
          <DashboardSection>
            <DashboardSectionHeading>Rozepsané</DashboardSectionHeading>
            {renderRows(drafts, 'drafts')}
            {isApprover && (
              <Link
                className={styles.allMyArticles}
                to={`${href('/administration/articles')}?${new URLSearchParams({ author: authorId })}`}
              >
                Všechny moje články
              </Link>
            )}
          </DashboardSection>
        )}

        {submitted.length > 0 && (
          <DashboardSection>
            <DashboardSectionHeading>Odeslané</DashboardSectionHeading>
            {renderRows(submitted, 'submitted')}
            {/* Under the rows it explains, and only when one is there (21b). */}
            {submitted.some((item) => item.row.state === 'published') && (
              <DashboardSectionNote>
                Publikované se zobrazují 14 dní po publikaci.
              </DashboardSectionNote>
            )}
          </DashboardSection>
        )}

        {isEmptyForAuthor && (
          <ListEmptyCard>
            <ListEmptyCardTitle>Zatím tu nic nemáte</ListEmptyCardTitle>
            <ListEmptyCardText>
              Tady můžete sledovat svůj obsah od konceptu po publikaci.
            </ListEmptyCardText>
            {renderNewArticleButton()}
          </ListEmptyCard>
        )}
      </div>

      {/* On a phone Nový článek waits at the bottom, in reach of the thumb
          (22g), unless the empty card already offers it. */}
      {canCreateArticle && !isEmptyForAuthor && (
        <ListActionBar>{renderNewArticleButton()}</ListActionBar>
      )}
    </AdminPage>
  )
}

export { loader } from './_loader'
export { meta } from './_meta'

// The dashboard sits outside the section layout; its own boundary keeps the sidebar.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <AdminBoundaryError error={error} />
}
