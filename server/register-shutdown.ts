type ClosableServer = {
  close(callback?: (error?: Error) => void): unknown
  closeIdleConnections(): void
}

type ShutdownOptions = {
  exit?: (code: number) => void
  graceMilliseconds?: number
  onShutdown?: () => Promise<void>
  server: ClosableServer
  signals?: readonly NodeJS.Signals[]
  subscribe?: (signal: NodeJS.Signals, listener: () => void) => void
}

/**
 * Closes the server on SIGTERM or SIGINT and ends the process.
 *
 * Requests in flight finish and idle keep-alive connections close at once. What else must stop
 * (Publikace's queue and database) stops at the same time, not after the server, since the
 * administration's server-sent events never end and would hold `close` open. The process exits
 * once both are done, or after the grace period regardless, inside Fly's five-second kill
 * timeout.
 *
 * @param options.server The HTTP server to close.
 * @param options.onShutdown What else to stop; a rejection is logged and still exits.
 * @param options.graceMilliseconds How long open requests get; 4 s by default.
 * @param options.exit, options.subscribe, options.signals Replaced in tests.
 */
export function registerShutdown({
  exit = (code) => process.exit(code),
  graceMilliseconds = 4000,
  onShutdown = async () => {},
  server,
  signals = ['SIGTERM', 'SIGINT'],
  subscribe = (signal, listener) => process.once(signal, listener),
}: ShutdownOptions): void {
  let isShuttingDown = false

  const shutdown = () => {
    if (isShuttingDown) return
    isShuttingDown = true

    setTimeout(() => {
      console.warn('[server] open requests outlived the grace period, exiting')
      exit(0)
    }, graceMilliseconds).unref()

    const serverClosed = new Promise<void>((resolve) => {
      server.close((error) => {
        if (error) console.error(error)
        resolve()
      })
    })
    server.closeIdleConnections()

    Promise.all([serverClosed, onShutdown().catch(console.error)]).then(() =>
      exit(0),
    )
  }

  for (const signal of signals) subscribe(signal, shutdown)
}
