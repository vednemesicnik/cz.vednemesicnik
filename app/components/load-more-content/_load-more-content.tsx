import { Form, useNavigation } from "react-router"

import { Button } from "~/components/button"

import style from "./_load-more-content.module.css"

export const LIMIT_PARAM = "limit"

type Props = {
  action: string
  limit: number
  children?: never
}
export const LoadMoreContent = ({ action, limit }: Props) => {
  const navigation = useNavigation()

  const isLoadingMore = navigation.state !== "idle"

  return (
    <Form
      className={style.container}
      method={"get"}
      action={action}
      preventScrollReset={true}
    >
      <input type={"hidden"} name={LIMIT_PARAM} value={limit} />
      <Button type={"submit"} disabled={isLoadingMore}>
        Načíst další
      </Button>
    </Form>
  )
}
