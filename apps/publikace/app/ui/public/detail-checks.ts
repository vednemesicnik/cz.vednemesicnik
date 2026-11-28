/**
 * The checks one load of the issue detail asks once it stands (`12q`, `12j`), asked one after
 * another and followed by one reload at most.
 *
 * In turn, because each check that finds a change writes it into the session for the reload, and
 * two requests saving the same session at once keep only the later one's write. One reload,
 * because a second would be an ordinary load to the server and draw away what the first one
 * showed: the rows just found, their sentence and the toast the detail opened with.
 */

import { TOAST_CLOSED_ATTRIBUTE } from './toast-closed.ts'

/**
 * The cookie naming the load whose reload the next request is, set just before it and read by the
 * server (`takeCheckReload`): what the checks recorded counts only for the reload they started,
 * never for another load of the detail that comes first, such as the page an action redirects to.
 */
export const CHECK_RELOAD_COOKIE = 'issueDetailReload'

/**
 * Set beside `CHECK_RELOAD_COOKIE`, to the same load, when the person closed the toast before the
 * reload: the server draws the kept toast closed, so it does not come back (`11g`).
 */
export const TOAST_CLOSED_COOKIE = 'issueDetailToastClosed'

const COOKIE_ATTRIBUTES = 'path=/issues; samesite=strict'

type Island = {
  /** Waits before the reload, as for a menu open on a row it changes (`12q`). */
  beforeReload?: () => Promise<void>
  isCurrent: () => boolean
  reload: () => Promise<unknown>
}

type Turn = {
  chain: Promise<void>
  /** Each kind's own answer: whether its check changed a record. */
  answers: Map<string, Promise<boolean>>
  done: Promise<void>
  end: () => void
  isChanged: boolean
  islands: Island[]
  waiting: number
}

const turns = new Map<string, Turn>()

function newTurn(): Turn {
  let end = () => {}
  let done = new Promise<void>((resolve) => {
    end = resolve
  })
  return {
    answers: new Map(),
    chain: Promise.resolve(),
    done,
    end,
    isChanged: false,
    islands: [],
    waiting: 0,
  }
}

async function reloadAfter(load: string, turn: Turn): Promise<void> {
  if (!turn.isChanged) return
  await Promise.all(turn.islands.map((island) => island.beforeReload?.()))
  let island = turn.islands.find((each) => each.isCurrent())
  if (island === undefined) return
  let isToastClosed = document.querySelector(`.vdm-toast[${TOAST_CLOSED_ATTRIBUTE}]`) !== null
  document.cookie = `${CHECK_RELOAD_COOKIE}=${load}; max-age=30; ${COOKIE_ATTRIBUTES}`
  if (isToastClosed) {
    document.cookie = `${TOAST_CLOSED_COOKIE}=${load}; max-age=30; ${COOKIE_ATTRIBUTES}`
  }
  try {
    await island.reload()
  } finally {
    document.cookie = `${CHECK_RELOAD_COOKIE}=; max-age=0; ${COOKIE_ATTRIBUTES}`
    if (isToastClosed) document.cookie = `${TOAST_CLOSED_COOKIE}=; max-age=0; ${COOKIE_ATTRIBUTES}`
  }
}

/**
 * Asks `check` after every check of the same `load` asked before it, once however many islands
 * ask for the same `kind`. A check answers whether it changed a record. When the last check of the
 * load settles and one of them changed something, the page reloads, unless no island that asked
 * is still `isCurrent`, as when the person has gone on to another page or a question over this
 * one. The promise settles once this kind's check found nothing, or once the turn has ended when
 * it changed something, so an island that waits on it waits for its own reload and no longer.
 */
export function checkInTurn(
  load: string,
  kind: string,
  check: () => Promise<boolean>,
  island: Island,
): Promise<void> {
  let turn = turns.get(load) ?? newTurn()
  turns.set(load, turn)
  turn.islands.push(island)
  let current = turn
  let answer = current.answers.get(kind)
  if (answer === undefined) {
    let asked = current.chain.then(check).catch(() => false)
    answer = asked
    current.answers.set(kind, asked)
    current.waiting += 1
    current.chain = asked.then(async (isChanged) => {
      if (isChanged) current.isChanged = true
      current.waiting -= 1
      if (current.waiting > 0) return
      turns.delete(load)
      await reloadAfter(load, current).catch(() => undefined)
      current.end()
    })
  }
  return answer.then((isChanged) => (isChanged ? current.done : undefined))
}
