import { href } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
import { AdminDetailAside } from '~/components/admin/admin-detail-aside'
import { AdminDetailItem } from '~/components/admin/admin-detail-item'
import { AdminDetailLayout } from '~/components/admin/admin-detail-layout'
import { AdminDetailList } from '~/components/admin/admin-detail-list'
import { AdminDetailMain } from '~/components/admin/admin-detail-main'
import { AdminDetailSection } from '~/components/admin/admin-detail-section'
import { AdminPage } from '~/components/admin/admin-page'
import { BaseLink } from '~/components/base-link'
import { Button } from '~/components/button'
import { type HistoryEntry, HistoryList } from '~/components/history-list'
import { Hyperlink } from '~/components/hyperlink'
import { Link } from '~/components/link'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import {
  STATUS_TAG_LABELS,
  StatusTag,
  type StatusTagState,
} from '~/components/status-tag'

import type { HeaderSentence } from '../../utils/article-actions'
import { RETURN_TO_OPENER_STATE } from '../../utils/return-to-opener-state'
import {
  TAXONOMY_ACTION_LABELS,
  type TaxonomyAction,
} from '../../utils/taxonomy-actions'
import type { TaxonomyRecordCopy } from '../../utils/taxonomy-record-copy'
import { useTaxonomyActions } from '../../utils/use-taxonomy-actions'
import { TaxonomyActionDialogs } from '../taxonomy-action-dialogs'
import styles from './_styles.module.css'

type Props = {
  record: {
    id: string
    name: string
    slug: string
    state: StatusTagState
    authorName: string
    factLine: string
    publishedArticleCount: number
    articleCount: number
    history: { entries: HistoryEntry[]; isIncomplete: boolean }
  }
  articles: {
    recentArticles: { id: string; title: string; state: StatusTagState }[]
    stateCounts: { queue: StatusTagState; count: number }[]
  }
  headerActions: {
    primary: TaxonomyAction | null
    outline: TaxonomyAction | null
    menu: TaxonomyAction[]
    sentence: HeaderSentence | null
  }
  copy: TaxonomyRecordCopy
  detailHref: string
  editHref: string
  articlesHref: string
}

// A draft, waiting or approved record opens on the web for anyone signed in;
// an archived one for nobody (25b, iq3nur0e).
const PREVIEWABLE_STATES: StatusTagState[] = ['draft', 'pending', 'approved']

/**
 * A category's or tag's detail (design 25b, 25e): the header with its actions
 * by state and role (07c, 23d), the record's latest articles where an article
 * has its text, and beside them its address, per-state counts, author and
 * history (23a).
 *
 * @param props.articles - Only the articles the viewer may see (25b).
 * @param props.articlesHref - The article list filtered to the record, in
 *   every state: the set the counts add up to.
 */
export const TaxonomyDetail = ({
  record,
  articles,
  headerActions,
  copy,
  detailHref,
  editHref,
  articlesHref,
}: Props) => {
  const actions = useTaxonomyActions({
    copy,
    deleteRedirects: true,
    detailHref,
    editHref,
    fetcherKey: `taxonomy-detail-${record.id}`,
    record,
  })
  const { getLabel, isSubmitting, runAction } = actions

  const publicPath = `${copy.publicPath}/${record.slug}`
  const stateCounts = articles.stateCounts.filter(({ count }) => count > 0)
  const articleTotal = stateCounts.reduce((sum, { count }) => sum + count, 0)

  const renderButton = (
    action: TaxonomyAction,
    variant: 'primary' | 'outline',
  ) => {
    switch (action) {
      case 'edit':
        return (
          <LinkButton
            disabled={isSubmitting}
            state={RETURN_TO_OPENER_STATE}
            to={editHref}
            variant={'outline'}
          >
            {TAXONOMY_ACTION_LABELS.edit}
          </LinkButton>
        )
      case 'view-on-web':
        return (
          <LinkButton
            rel={'noopener'}
            target={'_blank'}
            to={publicPath}
            variant={'outline'}
          >
            {TAXONOMY_ACTION_LABELS['view-on-web']}
          </LinkButton>
        )
      default:
        return (
          <Button
            disabled={isSubmitting}
            onClick={() => runAction(action)}
            type={'button'}
            variant={variant}
          >
            {getLabel(action)}
          </Button>
        )
    }
  }

  return (
    <AdminPage>
      <header className={styles.header}>
        <div className={styles.title}>
          <div className={styles.titleLine}>
            <PageTitle>{record.name}</PageTitle>
            <StatusTag state={record.state} />
          </div>
          {/* The article's line: the tag says the state (a3zejbc1). */}
          <span className={styles.subtitle}>
            {record.authorName} · {record.factLine}
          </span>
        </div>

        {/* One primary, one outline, the rest in „⋯“; where the role may do nothing, who can (23d). */}
        <div className={styles.actions}>
          {headerActions.sentence !== null && (
            <p className={styles.sentence}>
              {copy.headerSentences[headerActions.sentence]}
            </p>
          )}
          <ActionMenu
            items={headerActions.menu.map((action) => ({
              danger: action === 'delete',
              label: getLabel(action),
              onSelect: () => runAction(action),
            }))}
          />
          {headerActions.outline !== null &&
            renderButton(headerActions.outline, 'outline')}
          {headerActions.primary !== null &&
            renderButton(headerActions.primary, 'primary')}
        </div>
      </header>

      {/* The record's articles where an article has its text (25b). */}
      <AdminDetailLayout>
        <AdminDetailMain>
          <AdminDetailSection title={copy.articlesTitle}>
            {articles.recentArticles.length === 0 ? (
              <p className={styles.empty}>Zatím tu žádný článek není.</p>
            ) : (
              <>
                <ul className={styles.articles}>
                  {articles.recentArticles.map((article) => (
                    <li className={styles.article} key={article.id}>
                      <BaseLink
                        className={styles.articleLink}
                        to={href('/administration/articles/:articleId', {
                          articleId: article.id,
                        })}
                      >
                        {article.title}
                      </BaseLink>
                      <StatusTag state={article.state} />
                    </li>
                  ))}
                </ul>
                <Link className={styles.allArticles} to={articlesHref}>
                  {copy.allArticlesLink(articleTotal)}
                </Link>
              </>
            )}
          </AdminDetailSection>
        </AdminDetailMain>

        <AdminDetailAside>
          <AdminDetailSection title={'Údaje'}>
            <AdminDetailList>
              <AdminDetailItem label={'Adresa'}>
                {/* The preview is a link here, as on the article (a3zejbc1). */}
                {PREVIEWABLE_STATES.includes(record.state) ? (
                  <span className={styles.stack}>
                    <Hyperlink
                      href={publicPath}
                      rel={'noopener'}
                      target={'_blank'}
                    >
                      Náhled na webu
                    </Hyperlink>
                    <span className={styles.tertiary}>{publicPath}</span>
                  </span>
                ) : (
                  <span className={styles.tertiary}>{publicPath}</span>
                )}
              </AdminDetailItem>
              {/* One line per state, zeros left out; no row without articles (25b). */}
              {stateCounts.length > 0 && (
                <AdminDetailItem label={'Články'}>
                  <ul className={styles.counts}>
                    {stateCounts.map(({ queue, count }) => (
                      <li className={styles.count} key={queue}>
                        <span>{STATUS_TAG_LABELS[queue]}</span>
                        <span className={styles.number}>
                          {count.toLocaleString('cs-CZ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </AdminDetailItem>
              )}
              <AdminDetailItem label={'Autor'}>
                {record.authorName}
              </AdminDetailItem>
            </AdminDetailList>
          </AdminDetailSection>

          <AdminDetailSection title={'Historie'}>
            <HistoryList
              entries={record.history.entries}
              isIncomplete={record.history.isIncomplete}
              // A reused route component starts every record collapsed.
              key={record.id}
              visibleCount={5}
            />
          </AdminDetailSection>
        </AdminDetailAside>
      </AdminDetailLayout>

      <TaxonomyActionDialogs
        actions={actions}
        canDelete={headerActions.menu.includes('delete')}
      />
    </AdminPage>
  )
}
