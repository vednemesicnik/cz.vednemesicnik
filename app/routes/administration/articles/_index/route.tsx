// noinspection JSUnusedGlobalSymbols

import { href, useSearchParams } from 'react-router'
import { AdminBulkActionsBar } from '~/components/admin/admin-bulk-actions-bar'
import { AdminFilterSelect } from '~/components/admin/admin-filter-select'
import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminLinkButton } from '~/components/admin/admin-link-button'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminSavedFilters } from '~/components/admin/admin-saved-filters'
import {
  AdminTable,
  TableBody,
  TableEmptyRow,
  TableHeader,
  TableHeaderCell,
  TableSelectionHeaderCell,
  TableSortableHeaderCell,
  useAdminTableSelection,
} from '~/components/admin/admin-table'
import { AdminTableFilters } from '~/components/admin/admin-table-filters'
import { AdminTableSearch } from '~/components/admin/admin-table-search'
import { AdminTableToolbar } from '~/components/admin/admin-table-toolbar'
import { Pagination } from '~/components/pagination'
import { StateFilter } from '~/components/state-filter'
import type { ArticleQueue } from '~/config/article-queue-config'
import { getAdminListEmptyMessage } from '~/utils/admin-list-empty-message'
import { getPreservedFilterParams } from '~/utils/admin-list-filters'
import { useAdminListPending } from '~/utils/use-admin-list-pending'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { ItemRow } from './components/item-row'
import { SORT_KEYS } from './sort'
import { buildQueueSearch } from './utils/build-queue-search'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

// One sentence per empty queue, no button but in Koncepty (design 22e).
const EMPTY_QUEUE_SENTENCES: Record<ArticleQueue, string> = {
  approved: 'Mezi schválenými nejsou žádné články.',
  archived: 'Mezi archivovanými nejsou žádné články.',
  draft: 'V konceptech nejsou žádné články.',
  pending: 'Ke schválení nečekají žádné články.',
  published: 'Mezi publikovanými nejsou žádné články.',
  submitted: 'Mezi odeslanými nejsou žádné články.',
}

type Pill = { label: string; queue: ArticleQueue | undefined }

const PILLS: Pill[] = [
  { label: 'Vše', queue: undefined },
  { label: 'Koncepty', queue: 'draft' },
  { label: 'Ke schválení', queue: 'pending' },
  { label: 'Schválené', queue: 'approved' },
  { label: 'Publikované', queue: 'published' },
  { label: 'Archivované', queue: 'archived' },
]

// A Contributor approves nothing: Odeslané, waiting or approved (22i).
const CONTRIBUTOR_PILLS: Pill[] = [
  { label: 'Vše', queue: undefined },
  { label: 'Koncepty', queue: 'draft' },
  { label: 'Odeslané', queue: 'submitted' },
  { label: 'Publikované', queue: 'published' },
  { label: 'Archivované', queue: 'archived' },
]

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    activeFilterId,
    articles,
    authorOptions,
    canCreate,
    categoryOptions,
    currentFilterQuery,
    currentPage,
    filters,
    isApprover,
    isContributor,
    ownFilters,
    pageSize,
    query,
    queueCounts,
    sharedFilters,
    tagOptions,
    totalCount,
    totalPages,
  } = loaderData

  const [searchParams] = useSearchParams()
  const pending = useAdminListPending()

  // The queue is not a filter: the pills show it (22a).
  const { state: queue, ...fieldFilters } = filters
  const hasActiveFilters = Object.values(fieldFilters).some(
    (value) => value !== undefined,
  )
  const isQueueEmpty = totalCount === 0 && !hasActiveFilters && query === ''

  // selection + title + author + updatedAt + state + actions
  const columnCount = isContributor ? 5 : 6

  const pills = (isContributor ? CONTRIBUTOR_PILLS : PILLS).map((pill) => {
    const queueCount = queueCounts.find((entry) => entry.queue === pill.queue)

    return {
      // Ke schválení waits only for the Coordinator, who approves (22a).
      attention:
        pill.queue === 'pending' && isApprover && (queueCount?.count ?? 0) > 0,
      count: queueCount?.count,
      isActive: pill.queue === queue,
      label: pill.label,
      to: {
        search: buildQueueSearch(searchParams, pill.queue),
      },
    }
  })

  const newArticleLink = canCreate && (
    <AdminLinkButton to={href('/administration/articles/add-article')}>
      Nový článek
    </AdminLinkButton>
  )

  const deletableIds = articles
    .filter((article) => article.canDelete)
    .map((article) => article.id)
  const selection = useAdminTableSelection(deletableIds)

  return (
    <AdminPage>
      <AdminHeadline>Články</AdminHeadline>
      {newArticleLink}
      <StateFilter items={pills} label={'Stav'} />
      <AdminTableToolbar>
        <AdminTableSearch defaultValue={query} placeholder={'Hledat články…'} />
        <AdminBulkActionsBar
          action={href('/administration/articles')}
          onDone={selection.clear}
          selectedIds={selection.selectedIds}
        />
        {/* The pills own the queue; a filter submit keeps it. */}
        <AdminTableFilters
          preservedParams={[
            ...getPreservedFilterParams(searchParams, 'articles'),
            ...(queue === undefined
              ? []
              : [['state', queue] as [string, string]]),
          ]}
        >
          <AdminFilterSelect
            defaultValue={filters.category ?? ''}
            label={'Kategorie'}
            name={'category'}
            options={categoryOptions}
          />
          <AdminFilterSelect
            defaultValue={filters.tag ?? ''}
            label={'Štítek'}
            name={'tag'}
            options={tagOptions}
          />
          <AdminFilterSelect
            defaultValue={filters.author ?? ''}
            label={'Autor'}
            name={'author'}
            options={authorOptions}
          />
        </AdminTableFilters>
        {/* Sibling of the filter form, never a child: its rows submit their own
            forms, which cannot be nested inside another one. */}
        <AdminSavedFilters
          activeFilterId={activeFilterId}
          currentQuery={currentFilterQuery}
          ownFilters={ownFilters}
          sharedFilters={sharedFilters}
          tableKey={'articles'}
        />
      </AdminTableToolbar>
      {isQueueEmpty ? (
        // The table's head goes too; one sentence stands in its body (22e).
        <div className={styles.empty}>
          {queue === undefined ? (
            <>
              <p className={styles.emptyTitle}>Zatím tu není žádný článek</p>
              <p className={styles.emptyText}>
                Nový článek se uloží jako koncept.
              </p>
              {newArticleLink}
            </>
          ) : (
            <>
              <p className={styles.emptyTitle}>
                {EMPTY_QUEUE_SENTENCES[queue]}
              </p>
              {queue === 'draft' && newArticleLink}
            </>
          )}
        </div>
      ) : (
        <AdminTable pending={pending} stickyHeader={true}>
          <TableHeader>
            <TableSelectionHeaderCell
              checked={selection.allSelected}
              disabled={deletableIds.length === 0}
              indeterminate={selection.someSelected}
              onChange={selection.toggleAll}
            />
            <TableSortableHeaderCell
              defaultOrder={'desc'}
              defaultSort={'updatedAt'}
              sortKey={'title'}
              sortKeys={SORT_KEYS}
            >
              Název
            </TableSortableHeaderCell>
            {/* A Contributor is always the author (22i). */}
            {!isContributor && <TableHeaderCell>Autor</TableHeaderCell>}
            <TableSortableHeaderCell
              defaultOrder={'desc'}
              defaultSort={'updatedAt'}
              sortKey={'updatedAt'}
              sortKeys={SORT_KEYS}
            >
              Upraveno
            </TableSortableHeaderCell>
            <TableHeaderCell>Stav</TableHeaderCell>
            <TableHeaderCell variant={'actions'}>Akce</TableHeaderCell>
          </TableHeader>
          <TableBody>
            {totalCount === 0 ? (
              <TableEmptyRow colSpan={columnCount}>
                {getAdminListEmptyMessage({
                  emptyLabel: 'Žádné články',
                  hasActiveFilters,
                  query,
                })}
              </TableEmptyRow>
            ) : (
              articles.map((article) => (
                <ItemRow
                  article={article}
                  key={article.id}
                  onSelect={() => selection.toggle(article.id)}
                  selected={selection.isSelected(article.id)}
                  showAuthor={!isContributor}
                />
              ))
            )}
          </TableBody>
        </AdminTable>
      )}
      <Pagination
        currentPage={currentPage}
        layout={'inline'}
        noun={'článků'}
        pageSize={pageSize}
        size={'sm'}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </AdminPage>
  )
}
