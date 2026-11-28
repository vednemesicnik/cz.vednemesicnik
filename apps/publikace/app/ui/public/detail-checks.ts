/**
 * The checks one load of the issue detail asks once it stands (`12q`, `12j`), asked one after
 * another and followed by one reload at most.
 *
 * In turn, because each check that finds a change writes it into the session for the reload, and
 * two requests saving the same session at once keep only the later one's write. One reload,
 * because a second would be an ordinary load to the server and draw away what the first one
 * showed: the rows just found, their sentence and the toast the detail opened with.
 */
type Island = { isCurrent: () => boolean; reload: () => Promise<unknown> }

type Turn = {
  chain: Promise<void>
  checks: Map<string, Promise<void>>
  isChanged: boolean
  islands: Island[]
  waiting: number
}

const turns = new Map<string, Turn>()

/**
 * Asks `check` after every check of the same `load` asked before it, once however many islands
 * ask for the same `kind`. It answers whether it changed a record. When the last check of the load
 * settles and one of them changed something, the page reloads, unless no island that asked is
 * still `isCurrent`, as when the person has gone on to another page or a question over this one.
 */
export function checkInTurn(
  load: string,
  kind: string,
  check: () => Promise<boolean>,
  island: Island,
): Promise<void> {
  let turn = turns.get(load)
  if (turn === undefined) {
    turn = {
      chain: Promise.resolve(),
      checks: new Map(),
      isChanged: false,
      islands: [],
      waiting: 0,
    }
    turns.set(load, turn)
  }
  let current = turn
  current.islands.push(island)
  let asked = current.checks.get(kind)
  if (asked !== undefined) return asked

  current.waiting += 1
  let run = current.chain
    .then(check)
    .catch(() => false)
    .then(async (isChanged) => {
      if (isChanged) current.isChanged = true
      current.waiting -= 1
      if (current.waiting > 0) return
      turns.delete(load)
      if (!current.isChanged) return
      await current.islands.find((each) => each.isCurrent())?.reload()
    })
    .catch(() => undefined)
  current.chain = run
  current.checks.set(kind, run)
  return run
}
