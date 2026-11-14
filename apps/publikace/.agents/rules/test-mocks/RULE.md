---
name: test-mocks
description: |
  How a test installs a spy here, and the restore order that makes stacking two of them a
  silent trap.

  Trigger for:
  - Writing or editing a test that calls `t.mock.method` or `t.mock.fn`
  - Adding or changing a test helper that installs a spy on its caller's behalf
  - Reviewing a diff that changes how a test stubs `fetch`, `console`, or anything else on
    `globalThis`

  DO NOT trigger for:
  - Tests that substitute a collaborator by passing a fake in as an argument, which is how
    most of this suite works and needs no spy at all
---

# Test mocks

> Carried over from `cz.vednemesicnik.billing` while this repository has no application code yet.
> The rule applies here as written; the files it cites as examples are billing's. Replace them
> with this repository's own as the app grows.

## One spy per method per test

`remix/test` runs its per-test cleanup in the order it recorded it, not in reverse
(`@remix-run/test/src/lib/context.ts`). Two `t.mock.method` calls on the same target
therefore undo each other backwards: the first restore puts the real method back, and the
second puts the _first spy_ back. Whatever runs next in that worker is handed the spy.

Nothing fails when this happens. The next test almost always installs its own spy before it
looks at the method, so a stacked pair works by accident until something reads the method
without stubbing it first.

When one test needs more than one answer, keep a single spy and move the answer instead.

```ts
// bad — two spies on `fetch`, and the first one outlives the test
let failed = await withResponse(t, { error: 'send_failed', ok: false }).send(message())
let rejected = await withResponse(t, { error: 'unauthorized', ok: false }).send(message())

// good — one spy, and the answer is what changes
let refusal = 'send_failed'
t.mock.method(
  globalThis,
  'fetch',
  async () => new Response(JSON.stringify({ error: refusal, ok: false })),
)
let delivery = createAppsScriptMailSend(ENDPOINT)

let failed = await delivery.send(message())
refusal = 'unauthorized'
let rejected = await delivery.send(message())
```

## Count helper calls, not `t.mock.method`

A helper that takes `t` installs a spy for its caller, so two calls to it in one test stack
exactly as two literal ones do — and a search for `t.mock.method` finds neither. Reading a
file for this means counting every `withResponse(t, …)`, `capturing(t, …)` and
`answering(t, …)` that shares a test body.

## Let the context do the restoring

Taking the spy from `t` is what buys the automatic restore, and that is the whole reason to
take it from there. A test that calls `restore()` itself, or puts a method back in an
`afterEach`, is working around the rule above rather than following it — and the `afterEach`
form is worse, because it reads as tidy-up while doing the opposite.
