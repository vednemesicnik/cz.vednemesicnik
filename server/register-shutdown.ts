type ClosableServer = {
  close(callback?: (error?: Error) => void): unknown
  closeIdleConnections(): void
}

type ShutdownOptions = {
  exit?: (code: number) => void
  graceMilliseconds?: number
  server: ClosableServer
  signals?: readonly NodeJS.Signals[]
  subscribe?: (signal: NodeJS.Signals, listener: () => void) => void
}

/**
 * Closes the server on SIGTERM or SIGINT and ends the process.
 *
 * Requests in flight finish and idle keep-alive connections close at once. A stream that
 * never ends (the administration's server-sent events) would hold `close` open, so the
 * process exits after the grace period regardless, inside Fly's five-second kill timeout.
 *
 * @param options.server The HTTP server to close.
 * @param options.graceMilliseconds How long open requests get; 4 s by default.
 * @param options.exit, options.subscribe, options.signals Replaced in tests.
 */
export function registerShutdown({
  exit = (code) => process.exit(code),
  graceMilliseconds = 4000,
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

    server.close((error) => {
      if (error) console.error(error)
      exit(0)
    })
    server.closeIdleConnections()
  }

  for (const signal of signals) subscribe(signal, shutdown)
}
