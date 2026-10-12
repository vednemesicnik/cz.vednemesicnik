// noinspection JSUnusedGlobalSymbols

import { href, useSearchParams } from 'react-router'
import { AdminBulkActionsBar } from '~/components/admin/admin-bulk-actions-bar'
import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminLinkButton } from '~/components/admin/admin-link-button'
import { AdminPage } from '~/components/admin/admin-page'
import {
  AdminTable,
  TableBody,
  TableHeader,
  TableHeaderCell,
  TableSelectionHeaderCell,
  TableSortableHeaderCell,
  useAdminTableSelection,
} from '~/components/admin/admin-table'
import { AdminTableSearch } from '~/components/admin/admin-table-search'
import { AdminTableToolbar } from '~/components/admin/admin-table-toolbar'
import { Pagination } from '~/components/pagination'
import { StateFilter } from '~/components/state-filter'
import type { ArticleQueue } from '~/config/article-queue-config'
import { getPreservedFilterParams } from '~/utils/admin-list-filters'
import { useAdminListPending } from '~/utils/use-admin-list-pending'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { ActiveFilterChips } from './components/active-filter-chips'
import { FiltersPanel } from './components/filters-panel'
import { ItemRow } from './components/item-row'
import { SORT_KEYS } from './sort'
import { buildListSearch } from './utils/build-list-search'
import { getNoResultMessage } from './utils/get-no-result-message'
import { getSavedFilterSummary } from './utils/get-saved-filter-summary'

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

type Option = { label: string; value: string }

const findLabel = (options: Option[], value: string | undefined) =>
  options.find((option) => option.value === value)?.label

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
  const filterCount = Object.values(fieldFilters).filter(
    (value) => value !== undefined,
  ).length
  const isQueueEmpty = totalCount === 0 && filterCount === 0 && query === ''
  const isNoResult = totalCount === 0 && !isQueueEmpty

  const pillList = isContributor ? CONTRIBUTOR_PILLS : PILLS

  const pills = pillList.map((pill) => {
    const queueCount = queueCounts.find((entry) => entry.queue === pill.queue)

    return {
      // Ke schválení waits only for the Coordinator, who approves (22a).
      attention:
        pill.queue === 'pending' && isApprover && (queueCount?.count ?? 0) > 0,
      count: queueCount?.count,
      isActive: pill.queue === queue,
      label: pill.label,
      to: {
        search: buildListSearch(searchParams, { state: pill.queue }),
      },
    }
  })

  const newArticleLink = canCreate && (
    <AdminLinkButton to={href('/administration/articles/add-article')}>
      Nový článek
    </AdminLinkButton>
  )

  const chips = [
    {
      clearSearch: buildListSearch(searchParams, { category: undefined }),
      label: 'Rubrika',
      value: findLabel(categoryOptions, fieldFilters.category),
    },
    {
      clearSearch: buildListSearch(searchParams, { tag: undefined }),
      label: 'Štítek',
      value: findLabel(tagOptions, fieldFilters.tag),
    },
    {
      clearSearch: buildListSearch(searchParams, { author: undefined }),
      label: 'Autor',
      value: findLabel(authorOptions, fieldFilters.author),
    },
  ].flatMap((chip) =>
    chip.value === undefined ? [] : [{ ...chip, value: chip.value }],
  )
  const clearFiltersSearch = buildListSearch(searchParams, {
    author: undefined,
    category: undefined,
    tag: undefined,
  })

  const savedFilterSummary = getSavedFilterSummary({
    authorName: findLabel(authorOptions, fieldFilters.author),
    categoryName: findLabel(categoryOptions, fieldFilters.category),
    query,
    queueLabel:
      queue === undefined
        ? undefined
        : pillList.find((pill) => pill.queue === queue)?.label,
    tagName: findLabel(tagOptions, fieldFilters.tag),
  })

  const noResult = getNoResultMessage({ filterCount, query, queue })
  // The queue stays; the search, the filters or both go (22e).
  const noResultSearch = buildListSearch(searchParams, {
    ...(query === '' ? {} : { q: undefined }),
    ...(filterCount === 0
      ? {}
      : { author: undefined, category: undefined, tag: undefined }),
  })

  const deletableIds = articles
    .filter((article) => article.canDelete)
    .map((article) => article.id)
  const selection = useAdminTableSelection(deletableIds)

  return (
    <AdminPage>
      <AdminHeadline>Články</AdminHeadline>
      {newArticleLink}
      {/* One row: the queues on the left, the search and Filtry on the
          right (22a). */}
      <AdminTableToolbar>
        <StateFilter items={pills} label={'Stav'} />
        <div className={styles.toolbarEnd}>
          <AdminTableSearch
            defaultValue={query}
            placeholder={'Hledat v názvu a adrese'}
          />
          {/* The pills own the queue; a filter change keeps it. */}
          <FiltersPanel
            activeFilterId={activeFilterId}
            authorOptions={authorOptions}
            categoryOptions={categoryOptions}
            currentQuery={currentFilterQuery}
            filters={fieldFilters}
            ownFilters={ownFilters}
            preservedParams={[
              ...getPreservedFilterParams(searchParams, 'articles'),
              ...(queue === undefined
                ? []
                : [['state', queue] as [string, string]]),
            ]}
            sharedFilters={sharedFilters}
            summary={savedFilterSummary}
            tagOptions={tagOptions}
          />
        </div>
      </AdminTableToolbar>
      {chips.length > 0 && (
        <ActiveFilterChips chips={chips} clearAllSearch={clearFiltersSearch} />
      )}
      <AdminBulkActionsBar
        action={href('/administration/articles')}
        onDone={selection.clear}
        selectedIds={selection.selectedIds}
      />
      {isNoResult ? (
        // A search or a filter found nothing: a way back, the queue stays (22e).
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Nic nenalezeno</p>
          <p className={styles.emptyText}>{noResult.sentence}</p>
          <AdminLinkButton
            preventScrollReset={true}
            to={{ search: noResultSearch }}
          >
            {noResult.clearLabel}
          </AdminLinkButton>
        </div>
      ) : isQueueEmpty ? (
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
            {articles.map((article) => (
              <ItemRow
                article={article}
                key={article.id}
                onSelect={() => selection.toggle(article.id)}
                selected={selection.isSelected(article.id)}
                showAuthor={!isContributor}
              />
            ))}
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
