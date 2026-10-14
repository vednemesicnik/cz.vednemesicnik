import { href } from 'react-router'

import { Tabs } from '~/components/tabs'

import styles from './_styles.module.css'

const ITEMS = [
  { end: true, label: 'Články', to: href('/administration/articles') },
  { label: 'Rubriky', to: href('/administration/articles/categories') },
  { label: 'Štítky', to: href('/administration/articles/tags') },
]

/**
 * The tabs of the article lists, the first thing in the page (22a). Only the
 * three lists carry them; a detail has its breadcrumbs instead (23a).
 *
 * @returns The tabs Články · Rubriky · Štítky
 */
export const ArticlesTabs = () => {
  return <Tabs className={styles.tabs} items={ITEMS} label={'Články'} />
}
