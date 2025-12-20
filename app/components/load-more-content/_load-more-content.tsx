import { Form, useNavigation } from 'react-router'

import { Button } from '~/components/button'

import style from './_load-more-content.module.css'

export const LIMIT_PARAM = 'limit'

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
