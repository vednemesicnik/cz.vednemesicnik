/**
 * The checks one load of the issue detail asks once it stands (`12q`, `12j`), asked one after
 * another and followed by one reload at most.
 *
 * In turn, because each check that finds a change writes it into the session for the reload, and
 * two requests saving the same session at once keep only the later one's write. One reload,
 * because a second would be an ordinary load to the server and draw away what the first one
 * showed: the rows just found, their sentence and the toast the detail opened with.
 */

/**
 * The cookie naming the load whose reload the next request is, set just before it and read by the
 * server (`takeCheckReload`): what the checks recorded counts only for the reload they started,
 * never for another load of the detail that comes first, such as the page an action redirects to.
 */
export const CHECK_RELOAD_COOKIE = 'issueDetailReload'

type Island = {
  /** Waits before the reload, as for a menu open on a row it changes (`12q`). */
  beforeReload?: () => Promise<void>
  isCurrent: () => boolean
  reload: () => Promise<unknown>
}

type Turn = {
  chain: Promise<void>
  done: Promise<void>
  end: () => void
  isChanged: boolean
  islands: Island[]
  kinds: Set<string>
  waiting: number
}

const turns = new Map<string, Turn>()

function newTurn(): Turn {
  let end = () => {}
  let done = new Promise<void>((resolve) => {
    end = resolve
  })
  return {
    chain: Promise.resolve(),
    done,
    end,
    isChanged: false,
    islands: [],
    kinds: new Set(),
    waiting: 0,
  }
}

async function reloadAfter(load: string, turn: Turn): Promise<void> {
  if (!turn.isChanged) return
  await Promise.all(turn.islands.map((island) => island.beforeReload?.()))
  let island = turn.islands.find((each) => each.isCurrent())
  if (island === undefined) return
  document.cookie = `${CHECK_RELOAD_COOKIE}=${load}; path=/issues; max-age=30; samesite=strict`
  try {
    await island.reload()
  } finally {
    document.cookie = `${CHECK_RELOAD_COOKIE}=; path=/issues; max-age=0; samesite=strict`
  }
}

/**
 * Asks `check` after every check of the same `load` asked before it, once however many islands
 * ask for the same `kind`, and answers when the whole turn has ended. A check answers whether it
 * changed a record. When the last check of the load settles and one of them changed something,
 * the page reloads, unless no island that asked is still `isCurrent`, as when the person has gone
 * on to another page or a question over this one.
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
  if (turn.kinds.has(kind)) return turn.done

  let current = turn
  current.kinds.add(kind)
  current.waiting += 1
  current.chain = current.chain
    .then(check)
    .catch(() => false)
    .then(async (isChanged) => {
      if (isChanged) current.isChanged = true
      current.waiting -= 1
      if (current.waiting > 0) return
      turns.delete(load)
      await reloadAfter(load, current).catch(() => undefined)
      current.end()
    })
  return current.done
}
