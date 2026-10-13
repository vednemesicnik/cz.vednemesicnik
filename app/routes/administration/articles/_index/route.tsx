// noinspection JSUnusedGlobalSymbols

import { useId } from 'react'
import { href, useSearchParams } from 'react-router'
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
import { Link } from '~/components/link'
import { Pagination } from '~/components/pagination'
import type { ArticleQueue } from '~/config/article-queue-config'
import { useAdminListPending } from '~/utils/use-admin-list-pending'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { ArticleSelectionBar } from './components/article-selection-bar'
import { FilterMenu, type FilterOption } from './components/filter-menu'
import { ItemRow } from './components/item-row'
import { SavedFiltersMenu } from './components/saved-filters-menu'
import { SavedFiltersTrigger } from './components/saved-filters-trigger'
import { SORT_KEYS } from './sort'
import { buildClearFiltersSearch } from './utils/build-clear-filters-search'
import { formatWaitingWork } from './utils/format-waiting-work'
import { getEmptyListMessage } from './utils/get-empty-list-message'
import { getSavedFilterSummary } from './utils/get-saved-filter-summary'
import { useBulkActionResult } from './utils/use-bulk-action-result'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

type StateOption = { label: string; queue: ArticleQueue }

const STATE_OPTIONS: StateOption[] = [
  { label: 'Koncepty', queue: 'draft' },
  { label: 'Ke schválení', queue: 'pending' },
  { label: 'Schválené', queue: 'approved' },
  { label: 'Publikované', queue: 'published' },
  { label: 'Archivované', queue: 'archived' },
]

// A Contributor approves nothing: Odeslané, waiting or approved (22i).
const CONTRIBUTOR_STATE_OPTIONS: StateOption[] = [
  { label: 'Koncepty', queue: 'draft' },
  { label: 'Odeslané', queue: 'submitted' },
  { label: 'Publikované', queue: 'published' },
  { label: 'Archivované', queue: 'archived' },
]

const getLabels = (options: FilterOption[], values: string[] | undefined) =>
  options
    .filter((option) => values?.includes(option.value) ?? false)
    .map((option) => option.label)

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    articles,
    authorOptions,
    canCreate,
    categoryOptions,
    currentFilterQuery,
    currentPage,
    filters,
    isApprover,
    isContributor,
    matchingFilterId,
    ownFilters,
    pageSize,
    pendingCount,
    query,
    queueCounts,
    sharedFilters,
    tagOptions,
    totalCount,
    totalPages,
  } = loaderData

  const [searchParams] = useSearchParams()
  const pending = useAdminListPending()

  const states = filters.state ?? []
  const hasOtherFilters =
    query !== '' ||
    filters.category !== undefined ||
    filters.tag !== undefined ||
    filters.author !== undefined
  const isDefault = states.length === 0 && !hasOtherFilters

  const stateOptions: FilterOption[] = (
    isContributor ? CONTRIBUTOR_STATE_OPTIONS : STATE_OPTIONS
  ).map((option) => ({
    // Ke schválení waits only for the Coordinator, who approves (22d).
    attention: option.queue === 'pending' && isApprover && pendingCount > 0,
    count: queueCounts.find((entry) => entry.queue === option.queue)?.count,
    label: option.label,
    value: option.queue,
  }))

  // The work that waits, one click away, unless the list already shows just
  // that (22a).
  const showWaitingWork =
    isApprover &&
    pendingCount > 0 &&
    !(states.length === 1 && states[0] === 'pending')

  const clearFiltersSearch = buildClearFiltersSearch(searchParams)

  // useId() contains colons, which are invalid in an id/anchor context.
  const savedFiltersMenuId = `saved-filters-menu-${useId().replace(/:/g, '')}`
  const matchingFilterName = [...ownFilters, ...sharedFilters].find(
    (filter) => filter.id === matchingFilterId,
  )?.name

  const newArticleLink = canCreate && (
    <AdminLinkButton to={href('/administration/articles/add-article')}>
      Nový článek
    </AdminLinkButton>
  )

  const summaryLines = getSavedFilterSummary({
    authorNames: getLabels(authorOptions, filters.author),
    categoryNames: getLabels(categoryOptions, filters.category),
    query,
    stateLabels: getLabels(stateOptions, filters.state),
    tagNames: getLabels(tagOptions, filters.tag),
  })

  const emptyMessage = getEmptyListMessage({ hasOtherFilters, states })

  // A row joins the selection when the bar could apply something to it (22c).
  const selectableIds = articles
    .filter((article) => article.bulkActions.length > 0)
    .map((article) => article.id)
  const selection = useAdminTableSelection(selectableIds)
  useBulkActionResult(selection.clear)
  const selectedArticles = selection.selectedIds.flatMap((id) =>
    articles.filter((article) => article.id === id),
  )

  return (
    <AdminPage>
      <AdminHeadline>Články</AdminHeadline>
      {newArticleLink}
      {showWaitingWork && (
        <p className={styles.waitingWork}>
          <Link preventScrollReset={true} to={{ search: '?state=pending' }}>
            {formatWaitingWork(pendingCount)}
          </Link>
        </p>
      )}
      {/* Once a row is checked, the selection bar takes the filter row's place (22c). */}
      {selectedArticles.length > 0 ? (
        <ArticleSelectionBar
          action={href('/administration/articles')}
          articles={selectedArticles}
          className={styles.selectionBar}
          onClear={selection.clear}
        />
      ) : (
        /* Everything that narrows the list is a filter, in one row (22d). */
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <div className={styles.search}>
              <AdminTableSearch
                defaultValue={query}
                placeholder={'Hledat v názvu a adrese'}
              />
            </div>
            <div className={styles.filters}>
              <FilterMenu
                clearLabel={'Vše'}
                label={'Stav'}
                name={'state'}
                options={stateOptions}
                selectedValues={states}
              />
              <FilterMenu
                clearLabel={'Všechny'}
                label={'Rubrika'}
                name={'category'}
                options={categoryOptions}
                selectedValues={filters.category ?? []}
              />
              <FilterMenu
                clearLabel={'Všechny'}
                label={'Štítek'}
                name={'tag'}
                options={tagOptions}
                searchPlaceholder={'Hledat štítek'}
                selectedValues={filters.tag ?? []}
              />
              <FilterMenu
                clearLabel={'Všichni'}
                label={'Autor'}
                name={'author'}
                options={authorOptions}
                searchPlaceholder={'Hledat autora'}
                selectedValues={filters.author ?? []}
              />
              {!isDefault && (
                <Link
                  className={styles.clearFilters}
                  preventScrollReset={true}
                  to={{ search: clearFiltersSearch }}
                >
                  Zrušit filtry
                </Link>
              )}
              {/* On a phone Uložené filtry ends the scrolling row (22g). */}
              <SavedFiltersTrigger
                className={styles.phoneTrigger}
                matchingFilterName={matchingFilterName}
                menuId={savedFiltersMenuId}
              />
            </div>
          </div>
          {/* Apart from the filters: it sets them all at once (22d). */}
          <SavedFiltersMenu
            currentQuery={currentFilterQuery}
            matchingFilterId={matchingFilterId}
            matchingFilterName={matchingFilterName}
            menuId={savedFiltersMenuId}
            ownFilters={ownFilters}
            sharedFilters={sharedFilters}
            summaryLines={summaryLines}
            triggerClassName={styles.wideTrigger}
          />
        </div>
      )}
      {totalCount === 0 ? (
        // The table's head goes too; one sentence stands in its body (22e).
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{emptyMessage.title}</p>
          {emptyMessage.text !== null && (
            <p className={styles.emptyText}>{emptyMessage.text}</p>
          )}
          {emptyMessage.action === 'newArticle' && newArticleLink}
          {emptyMessage.action === 'clearFilters' && (
            <AdminLinkButton
              preventScrollReset={true}
              to={{ search: clearFiltersSearch }}
            >
              Zrušit filtry
            </AdminLinkButton>
          )}
        </div>
      ) : (
        <AdminTable pending={pending} stickyHeader={true}>
          <TableHeader>
            <TableSelectionHeaderCell
              checked={selection.allSelected}
              disabled={selectableIds.length === 0}
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
