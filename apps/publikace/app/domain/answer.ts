import { tied } from './public/typography.ts'
import { formatDate, formatMoment, atTime } from './time.ts'

/**
 * Answering a reply from _Ke kontrole_ (`13d`–`13h`, r1oqllvb): the editor-in-chief's text goes
 * to the provider of a batch, or the author of a clause, inside the thread of the consent
 * request. The wording of the artworks is from `bn9dbz05`, the article's from `0kwr8vpl`.
 */

/** Which card an answer belongs to: a batch of artworks or one author's clause. */
export type AnswerKind = 'articles' | 'artworks'

/** The longest answer, in characters as typed (`13d`). */
export const ANSWER_MAX_LENGTH = 5000

const NUMBER = new Intl.NumberFormat('cs-CZ')

export type AnswerCheck = { ok: true; text: string } | { error: string; ok: false; text: string }

/**
 * The answer as it will go, or why it cannot: nothing but whitespace, or longer than the cap. A
 * browser sends a line break as CR LF, so it is counted as one character, as the field counts it.
 */
export function checkAnswer(raw: string): AnswerCheck {
  let text = raw.replaceAll('\r\n', '\n').trim()
  if (text === '') return { error: 'Napište odpověď.', ok: false, text }
  if (text.length > ANSWER_MAX_LENGTH) {
    let count = NUMBER.format(text.length)
    let cap = NUMBER.format(ANSWER_MAX_LENGTH)
    return {
      error: tied`Zkraťte odpověď na nejvýš ${cap} znaků. Teď jich má ${count}.`,
      ok: false,
      text,
    }
  }
  return { ok: true, text }
}

/**
 * The name the answer is signed with, or `null` for the newsroom's signature alone. The sign-in
 * names a person by the address when Google gave no name, and an address does not belong under
 * an answer to somebody outside the newsroom (`13d`).
 */
export function signatureOf(identity: { displayName: string; email: string }): string | null {
  let name = identity.displayName.trim()
  return name === '' || name === identity.email ? null : name
}

/**
 * The Mailer's key for an answer: one per message of the provider, so a retry after a send the
 * Mailer did not confirm mails nobody a second time (`13e`).
 */
export function answerIdempotencyKey(kind: AnswerKind, id: number, messageId: string): string {
  return `consent-answer:${kind === 'articles' ? 'clause' : 'batch'}:${id}:${messageId}`
}

/*
 * How long an answer with no outcome yet counts as still on its way: past the app's 15 s wait
 * for the Mailer and the Mailer's own time to send. Within it nobody may send it again, so two
 * tabs cannot ask the Mailer at once; after it, an attempt a dead process left is retried.
 */
const IN_FLIGHT_SECONDS = 60

/** An answer the Mailer is still being asked about, which must not be sent again yet. */
export function isInFlight(
  answer: {
    failedAt: Temporal.Instant | null
    refusedAt: Temporal.Instant | null
    sentAt: Temporal.Instant | null
    startedAt: Temporal.Instant
  },
  at: Temporal.Instant,
): boolean {
  if (answer.sentAt !== null || answer.failedAt !== null || answer.refusedAt !== null) return false
  return Temporal.Instant.compare(answer.startedAt.add({ seconds: IN_FLIGHT_SECONDS }), at) > 0
}

/* ─── The form on the card (`13d`) ──────────────────────────────────────────────────────── */

export const ANSWER_LABEL = 'Odpovědět'
export const SEND_ANSWER_LABEL = 'Odeslat odpověď'
export const SENDING_ANSWER_LABEL = 'Odpověď se odesílá…'
export const CANCEL_ANSWER_LABEL = 'Zrušit'
export const RETRY_ANSWER_LABEL = 'Odeslat znovu'
export const CLOSE_ANSWER_LABEL = 'Zavřít'
export const SIGNATURE_NEWSROOM = 'Vedneměsíčník'

export function answerFieldLabel(kind: AnswerKind): string {
  return kind === 'articles' ? 'Odpověď autorovi' : 'Odpověď poskytovateli'
}

/** The note under the field, which promises the signature only when there is a name to sign. */
export function answerHint(kind: AnswerKind, hasName: boolean): string {
  let signature = hasName ? 'váš podpis' : 'podpis redakce'
  if (kind === 'articles') {
    return tied`Odpověď odejde jen tomuto autorovi ve vlákně žádosti o potvrzení finální verze. Pod textem bude ${signature} a dále citace poslední zprávy autora. Bez formátování a příloh, nejvýš 5\u00a0000 znaků.`
  }
  return tied`Odpověď odejde jen poskytovateli ve vlákně žádosti o souhlas. Pod textem bude ${signature} a dále citace poslední zprávy poskytovatele. Bez formátování a příloh, nejvýš 5\u00a0000 znaků.`
}

/** Under a field locked after a send the Mailer did not confirm (`13e`). */
export const LOCKED_ANSWER_HINT = tied`Text zůstává stejný, aby odpověď při dalším pokusu neodešla dvakrát.`

/* ─── What came of it (`13e`) ───────────────────────────────────────────────────────────── */

/**
 * Every way an answer can end, short of going: the form stays on the card with its text, and
 * the Callout over the buttons says why (r1oqllvb: an error on the card, not in a toast).
 */
export type AnswerRefusal =
  | 'approved'
  | 'closed'
  | 'daily-cap'
  | 'invalid'
  | 'newer-reply'
  | 'refused'
  | 'taken'
  | 'unconfirmed'

export type AnswerCallout = {
  text: string
  title: string
  tone: 'error' | 'success' | 'warning'
}

/** The Callout of a refusal; `invalid` has none, its sentence stands under the field. */
export function answerCallout(
  refusal: Exclude<AnswerRefusal, 'invalid'>,
  context: { email: string; issueName: string; kind: AnswerKind },
): AnswerCallout {
  let isArticle = context.kind === 'articles'
  switch (refusal) {
    case 'unconfirmed':
      return {
        text: 'Odeslání se nepodařilo potvrdit.',
        title: 'Zkuste odpověď odeslat za chvíli znovu.',
        tone: 'error',
      }
    case 'refused':
      return {
        text: tied`Pošta odpověď na ${context.email} trvale odmítla.`,
        title: isArticle
          ? 'Pokud potřebujete autorovi odpovědět, zkuste to jinou cestou.'
          : 'Pokud potřebujete poskytovateli odpovědět, zkuste to jinou cestou.',
        tone: 'error',
      }
    case 'daily-cap':
      return {
        text: tied`Dnes už z formulářů Publikace odešlo příliš mnoho e-mailů.`,
        title: tied`Zkuste odpověď odeslat později.`,
        tone: 'error',
      }
    case 'newer-reply':
      return {
        text: tied`Vaše odpověď neodešla, text zůstal v poli.`,
        title: isArticle
          ? 'Přečtěte si novou odpověď autora.'
          : 'Přečtěte si novou odpověď poskytovatele.',
        tone: 'warning',
      }
    case 'taken':
      return {
        text: 'Vaše odpověď neodešla.',
        title: isArticle
          ? 'Přečtěte si odpověď, která autorovi mezitím odešla.'
          : 'Přečtěte si odpověď, která poskytovateli mezitím odešla.',
        tone: 'warning',
      }
    case 'approved':
      return {
        text: 'Vaše odpověď neodešla.',
        title: isArticle
          ? 'Od autora mezitím přišla odpověď „Souhlasím“.'
          : 'Díla jsou mezitím schválená. Od poskytovatele přišla odpověď „Souhlasím“.',
        tone: 'success',
      }
    case 'closed':
      return {
        text: 'Odpověď neodešla.',
        title: tied`Vydání ${context.issueName} je mezitím uzavřené.`,
        tone: 'error',
      }
  }
}

/** The toast once the Mailer confirmed it, naming the address as `12o` does (`13e`). */
export function answerSentToast(email: string): string {
  return tied`Odpověď odešla na ${email}.`
}

/* ─── The answers on the card (`13e`, `13f`) ────────────────────────────────────────────── */

/**
 * `Odpovědi z Publikace (1)` on the card just answered, `Dřívější odpovědi z Publikace (4)` once
 * the provider wrote again: _dřívější_ is before the message the card quotes.
 */
export function answersTitle(count: number, isEarlier: boolean): string {
  return `${isEarlier ? 'Dřívější odpovědi' : 'Odpovědi'} z Publikace (${count})`
}

/** `19. 11. v 9:41 · Marie Horáková`. */
export function answerMeta(at: Temporal.Instant, name: string, today: Temporal.Instant): string {
  return `${formatMoment(at, today)} · ${name}`
}

/** Under an answer whose send was never confirmed and which a newer message overtook (`13e`). */
export const UNCONFIRMED_ANSWER_LINE = 'odeslání nepotvrzeno'

/* ─── An answer to a replaced final version (issue #31, `gjovqe1p`, `injg8rmg`) ─────────── */

export const UNSENT_ANSWER_TITLE = 'Odpověď neodešla'
export const UNSENT_ANSWER_NOTE = tied`Po dalším načtení stránky už tu text nebude.`

/** `Klára Šimková · klara.simkova@external.test`. */
export function unsentAnswerLine(name: string, email: string): string {
  return `${name} · ${email}`
}

/* ─── The e-mail (`13h`) ────────────────────────────────────────────────────────────────── */

/**
 * `Vaše zpráva přijatá 14. 11. 2026 v 8:30:` over the quote. It does not guess the sender's
 * gender (_napsal_), and _přijatá_ is the moment `přijato` names on the card.
 */
export function quoteIntro(receivedAt: Temporal.Instant): string {
  return `Vaše zpráva přijatá ${formatDate(receivedAt)} ${atTime(receivedAt)}:`
}
