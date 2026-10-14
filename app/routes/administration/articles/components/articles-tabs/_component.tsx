import { href } from 'react-router'

import { Tabs } from '~/components/tabs'
import { TabsItem } from '~/components/tabs-item'

import styles from './_styles.module.css'

/**
 * The tabs of the article lists, the first thing in the page (22a). Only the
 * three lists carry them; a detail has its breadcrumbs instead (23a).
 *
 * @returns The tabs Články · Rubriky · Štítky
 */
export const ArticlesTabs = () => {
  return (
    <Tabs className={styles.tabs} label={'Články'}>
      <TabsItem end={true} to={href('/administration/articles')}>
        Články
      </TabsItem>
      <TabsItem to={href('/administration/articles/categories')}>
        Rubriky
      </TabsItem>
      <TabsItem to={href('/administration/articles/tags')}>Štítky</TabsItem>
    </Tabs>
  )
}
