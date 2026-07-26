import { Form, useNavigation } from 'react-router'

import { Button } from '~/components/button'

import style from './_load-more-content.module.css'

export const LIMIT_PARAM = 'limit'

/**
 * Items rendered per page — also the size of each "load more" batch.
 *
 * Kept low on purpose: tiles enter with a staggered fade, and a tile at
 * `opacity: 0` is not an LCP candidate, so the whole stagger window is paid in
 * LCP. It doubles as the number of tiles a page chains on load — anything past
 * it renders below the fold and is left to reveal on scroll.
 */
export const PAGE_SIZE = 12

type Props = {
  action: string
  limit: number
  children?: never
}
export const LoadMoreContent = ({ action, limit }: Props) => {
  const navigation = useNavigation()

  const isLoadingMore = navigation.state !== 'idle'

  return (
    <Form
      action={action}
      className={style.container}
      method={'get'}
      preventScrollReset={true}
    >
      <input name={LIMIT_PARAM} type={'hidden'} value={limit} />
      <Button disabled={isLoadingMore} type={'submit'}>
        Načíst další
      </Button>
    </Form>
  )
}
