import { getEditorialBoard } from '~/utils/editorial-board.server'

export const loader = async () => {
  // `null` when GAS is unconfigured or every resilience layer is exhausted; the
  // route renders a fallback message in that case.
  const editorialBoard = await getEditorialBoard()

  return { editorialBoard }
}
