// noinspection JSUnusedGlobalSymbols

import { Form, href } from 'react-router'
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
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { ClearFiltersButton } from '~/components/clear-filters-button'
import { ClearFiltersLink } from '~/components/clear-filters-link'
import { FilterBar } from '~/components/filter-bar'
import { FilterBarFilters } from '~/components/filter-bar-filters'
import { FilterBarGroup } from '~/components/filter-bar-group'
import { FilterBarSearch } from '~/components/filter-bar-search'
import { FilterCell } from '~/components/filter-cell'
import { FilterMenu } from '~/components/filter-menu'
import { ListActionBar } from '~/components/list-action-bar'
import { ListEmptyCard } from '~/components/list-empty-card'
import { ListEmptyCardText } from '~/components/list-empty-card-text'
import { ListEmptyCardTitle } from '~/components/list-empty-card-title'
import { ListHeader } from '~/components/list-header'
import { PageTitle } from '~/components/page-title'
import { Pagination } from '~/components/pagination'
import { SavedFiltersMenu } from '~/components/saved-filters-menu'
import { SavedFiltersTrigger } from '~/components/saved-filters-trigger'
import { ARTICLE_BULK_NOUN } from '~/config/bulk-noun-config'
import { ARTICLE_NOUN } from '~/config/list-noun-config'
import { useAdminNoticeToast } from '~/hooks/use-admin-notice-toast'
import { useBulkActionResult } from '~/utils/bulk-action/use-bulk-action-result'
import { getListEmptyMessage } from '~/utils/get-list-empty-message'
import { getOptionLabels } from '~/utils/get-option-labels'
import { getSavedFilterSummary } from '~/utils/get-saved-filter-summary'
import { getStateFilter } from '~/utils/get-state-filter'
import { useAdminListPending } from '~/utils/use-admin-list-pending'
import { ArticlesTabs } from '../components/articles-tabs'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { ArticleSelectionBar } from './components/article-selection-bar'
import { ItemRow } from './components/item-row'
import { SORT_KEYS } from './sort'
import { BULK_ACTION_FETCHER_KEY } from './utils/bulk-action-fetcher-key'
import { useLiveArticleRows } from './utils/use-live-article-rows'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
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
    query,
    sharedFilters,
    tagOptions,
    totalCount,
    totalPages,
  } = loaderData

  useAdminNoticeToast(loaderData)

  // Live, but the rows stay put until the next load (22f).
  const { articles, liveChanges, queueCounts } = useLiveArticleRows(loaderData)

  const pending = useAdminListPending()

  const states = filters.state ?? []
  const hasOtherFilters =
    query !== '' ||
    filters.category !== undefined ||
    filters.tag !== undefined ||
    filters.author !== undefined
  const isDefault = states.length === 0 && !hasOtherFilters

  const stateFilter = getStateFilter({
    isApprover,
    isContributor,
    noun: ARTICLE_NOUN,
    queueCounts,
  })

  const matchingFilterName = [...ownFilters, ...sharedFilters].find(
    (filter) => filter.id === matchingFilterId,
  )?.name

  // Nový článek creates the draft and opens it (log 0020), so it posts.
  const renderNewArticleButton = () =>
    canCreate && (
      <Form
        action={href('/administration/articles/add-article')}
        method={'post'}
      >
        <AuthenticityTokenInput />
        <Button type={'submit'}>Nový článek</Button>
      </Form>
    )

  const summaryLines = getSavedFilterSummary({
    filters: [
      {
        label: 'Stav',
        valueLabels: getOptionLabels(stateFilter.options, filters.state),
      },
      {
        label: 'Rubrika',
        valueLabels: getOptionLabels(categoryOptions, filters.category),
      },
      {
        label: 'Štítek',
        valueLabels: getOptionLabels(tagOptions, filters.tag),
      },
      {
        label: 'Autor',
        valueLabels: getOptionLabels(authorOptions, filters.author),
      },
    ],
    query,
  })

  const emptyMessage = getListEmptyMessage({
    hasOtherFilters,
    noun: ARTICLE_NOUN,
    states,
  })

  // A row joins the selection when the bar could apply something to it (22c).
  const selectableIds = articles
    .filter((article) => article.bulkActions.length > 0)
    .map((article) => article.id)
  const selection = useAdminTableSelection(selectableIds)
  useBulkActionResult({
    fetcherKey: BULK_ACTION_FETCHER_KEY,
    noun: ARTICLE_BULK_NOUN,
    onClear: selection.clear,
  })
  const selectedArticles = selection.selectedIds.flatMap((id) =>
    articles.filter((article) => article.id === id),
  )
  const hasSelection = selectedArticles.length > 0

  return (
    <AdminPage>
      <ArticlesTabs />
      {/* On a phone Nový článek waits at the bottom, in reach of the thumb,
          and the top bar names the page (22g). */}
      <ListHeader>
        <PageTitle>Články</PageTitle>
        {renderNewArticleButton()}
      </ListHeader>
      {/* Once a row is checked, the selection bar takes the filter row's place
          in the same cell, so the table does not move (22c, cioukqn6); on a
          wide screen only: a phone has no selection (22g), even one carried
          over from a wider window. */}
      <FilterCell>
        {hasSelection && (
          <ArticleSelectionBar
            action={href('/administration/articles')}
            articles={selectedArticles}
            className={styles.selectionBar}
            isCreator={!isApprover && !isContributor}
            onClear={selection.clear}
          />
        )}
        {/* Everything that narrows the list is a filter, in one row (22d). */}
        <FilterBar replaced={hasSelection}>
          <FilterBarGroup>
            <FilterBarSearch
              defaultValue={query}
              placeholder={'Název nebo adresa'}
            />
            <FilterBarFilters>
              <FilterMenu
                attention={stateFilter.attention}
                clearLabel={'Vše'}
                label={'Stav'}
                name={'state'}
                options={stateFilter.options}
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
              {!isDefault && <ClearFiltersLink />}
              <SavedFiltersTrigger
                matchingFilterName={matchingFilterName}
                placement={'filters'}
              />
            </FilterBarFilters>
          </FilterBarGroup>
          {/* Apart from the filters: it sets them all at once (22d). */}
          <SavedFiltersMenu
            currentQuery={currentFilterQuery}
            defaultHint={ARTICLE_NOUN.defaultFilterHint}
            matchingFilterId={matchingFilterId}
            matchingFilterName={matchingFilterName}
            ownFilters={ownFilters}
            sharedFilters={sharedFilters}
            summaryLines={summaryLines}
            tableKey={'articles'}
          />
        </FilterBar>
      </FilterCell>
      {totalCount === 0 ? (
        // The table's head goes too; one sentence stands in its body (22e).
        <ListEmptyCard>
          <ListEmptyCardTitle>{emptyMessage.title}</ListEmptyCardTitle>
          {emptyMessage.text !== null && (
            <ListEmptyCardText>{emptyMessage.text}</ListEmptyCardText>
          )}
          {emptyMessage.action === 'create' && renderNewArticleButton()}
          {emptyMessage.action === 'clearFilters' && <ClearFiltersButton />}
        </ListEmptyCard>
      ) : (
        <AdminTable
          // A Contributor is always the author, so no Autor track (22i).
          columnsClassName={
            isContributor ? styles.columnsWithoutAuthor : styles.columns
          }
          pending={pending}
          stickyHeader={true}
        >
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
            {/* On a wide table categories and tags get columns (31a). */}
            <TableHeaderCell className={styles.categoriesColumn}>
              Rubriky
            </TableHeaderCell>
            <TableHeaderCell className={styles.tagsColumn}>
              Štítky
            </TableHeaderCell>
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
                isApprover={isApprover}
                key={article.id}
                liveChange={liveChanges.get(article.id)}
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
        noun={ARTICLE_NOUN.countForms}
        pageSize={pageSize}
        size={'sm'}
        totalCount={totalCount}
        totalPages={totalPages}
      />
      {/* A bar that stays at the bottom of a phone's screen (22g, d9en8oih),
          unless the empty list already offers it (22e). */}
      {canCreate && (totalCount > 0 || emptyMessage.action !== 'create') && (
        <ListActionBar>{renderNewArticleButton()}</ListActionBar>
      )}
    </AdminPage>
  )
}
