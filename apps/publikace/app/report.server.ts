/**
 * Hands an unexpected error to the host's error tracking, with the part of the app it came from
 * (`request`, `record`, `auth`, `drive`, `data`). The host behind `publikace.vednemesicnik.cz`
 * passes one to `createPublikace`; it is the shape `server/start-publikace.ts` gives it. The log
 * line is written beside it either way.
 */
export type ReportError = (error: unknown, area: string) => void

/** Publikace on its own (`server.ts`, the fake app, the suite): the log line is all there is. */
export const ignoreErrors: ReportError = () => {}
