/**
 * The form _Nahrání obrazových děl_: its limits and rules (`21a`, `21b`), checked the same in the
 * browser and on the server, and its words, as the copywriter settled them (`zoy6ixjt`). Under
 * `public/`, so the browser may load it, and free of anything it could not.
 *
 * The limits are the script's (`SCRIPT__Publication__Artwork_Upload`, `CONFIG`): the page keeps
 * _stejná pole, formáty a limity_ (`21a`).
 */

import { tied } from './typography.ts'

export const MAX_ARTWORKS = 20
export const MAX_FILE_MEGABYTES = 15
export const MAX_FILE_BYTES = MAX_FILE_MEGABYTES * 1024 * 1024
export const MAX_ARTWORK_AUTHOR_LENGTH = 200
export const MAX_SOURCE_LENGTH = 2000
export const MAX_PROVIDER_NAME_LENGTH = 200

/** The types an artwork may have, each with the extension it is stored under. */
export const ARTWORK_TYPES: Readonly<Record<string, string>> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/tiff': '.tif',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
}

const EXTENSION_TYPES: Readonly<Record<string, string>> = {
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.webp': 'image/webp',
}

/** What the file chooser offers: the drawn `image/*`, so a phone opens its gallery and camera. */
export const ARTWORK_ACCEPT = 'image/*'

/**
 * The type a chosen file claims, from its own type or, where a browser leaves that empty (HEIC on
 * many desktops), from its extension. `null` is a file that is no image of an allowed type.
 */
export function claimedType(file: { name: string; type: string }): string | null {
  if (file.type in ARTWORK_TYPES) return file.type
  let match = /(\.[^./\\]+)$/.exec(file.name)
  let fromName = EXTENSION_TYPES[match?.[1]?.toLowerCase() ?? '']
  return file.type === '' || file.type === 'application/octet-stream' ? (fromName ?? null) : null
}

/** `3,2 MB`: the size on a card. */
export function formatSize(bytes: number): string {
  let megabytes = bytes / (1024 * 1024)
  if (megabytes < 0.1) return '0,1 MB'
  return `${megabytes.toFixed(1).replace('.', ',')} MB`
}

/* `21b`, refused at the choice. The size is rounded up, so a file just over the limit never reads
   as 15 MB. */
export function tooLargeMessage(fileName: string, bytes: number): string {
  return `Vyberte obrázek do ${MAX_FILE_MEGABYTES} MB — ${fileName} má ${Math.ceil(bytes / (1024 * 1024))} MB.`
}

export function notImageMessage(fileName: string): string {
  return `Vyberte obrázek — ${fileName} není obrázek.`
}

/** The refusal of one chosen file before it uploads, or `null` when it may upload. */
export function choiceRefusal(file: { name: string; size: number; type: string }): string | null {
  if (claimedType(file) === null || file.size === 0) return notImageMessage(file.name)
  if (file.size > MAX_FILE_BYTES) return tooLargeMessage(file.name, file.size)
  return null
}

export const TOO_MANY_NOTE = 'Víc než 20 děl najednou nejde. Další pošlete po odeslání.'

/* `21b`, the cap on uploads through one link: the step depends on whether this page already has an
   uploaded artwork, the reason is the same. */
export const UPLOAD_CAP_WITH_UPLOADS = 'Nahraná díla můžete odeslat. Další zkuste nahrát později.'
export const UPLOAD_CAP_WITHOUT_UPLOADS = 'Zkuste díla nahrát později, nebo dejte vědět šéfredakci.'
export const UPLOAD_CAP_REASON = tied`Z tohoto odkazu se za poslední hodinu nahrálo 60 souborů.`

/* `21b`, a card whose file uploaded but is no image the server recognises. */
export function unreadableTitle(fileName: string): string {
  return `${fileName} se nepodařilo zpracovat`
}
export const UNREADABLE_TEXT = 'Zkuste ho vyfotit znovu nebo vybrat ve formátu JPG.'
export const CHOOSE_ANOTHER_LABEL = 'Vybrat jiný soubor'

/* `21b`, an upload the signal cut. */
export const INTERRUPTED_TEXT = 'Nahrávání se přerušilo.'
export const RETRY_LABEL = 'Zkusit znovu'

/* `21b`, the source. */
export const SOURCE_NOT_URL_MESSAGE = 'Vložte celou adresu, začíná https://.'
export const SOURCE_HOME_PAGE_MESSAGE = 'Vložte odkaz na stránku tohoto díla, ne na úvod webu.'
/* Derived from the article name's sentence, not yet through the copywriter. */
export const LONG_SOURCE_MESSAGE = 'Zkraťte odkaz na nejvýš 2000 znaků.'
export const LONG_ARTWORK_AUTHOR_MESSAGE = 'Zkraťte jméno na nejvýš 200 znaků.'

/**
 * The source's rule, the script's (`upload-script.html`, `sourceUrlProblem`): empty is allowed, and
 * an address must point at the artwork itself, not at a site's home page, which cannot be traced
 * back to one image. Only `https://`, as the drawn sentence says.
 */
export function checkSource(value: string): string | null {
  if (value === '') return null
  if (value.length > MAX_SOURCE_LENGTH) return LONG_SOURCE_MESSAGE
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return SOURCE_NOT_URL_MESSAGE
  }
  /* The parser mends `https:example.test`; the rule is the address as it was typed. */
  if (!/^https:\/\//i.test(value) || url.protocol !== 'https:' || /\s/.test(value)) {
    return SOURCE_NOT_URL_MESSAGE
  }
  if (url.pathname.replace(/\/+$/, '') === '' && url.search === '') {
    return SOURCE_HOME_PAGE_MESSAGE
  }
  return null
}

/* The provider's fields. Not drawn for this page: the article form's sentences where they fit. */
export const EMPTY_PROVIDER_NAME_MESSAGE = tied`Vyplňte jméno a příjmení.`
export const LONG_PROVIDER_NAME_MESSAGE = 'Zkraťte jméno na nejvýš 200 znaků.'
/* Not yet through the copywriter: the article's sentence names the author. */
export const EMPTY_PROVIDER_EMAIL_MESSAGE = 'Vyplňte e-mail.'
export const MISSING_AT_MESSAGE = 'Doplňte do e-mailové adresy zavináč.'
export const INVALID_EMAIL_MESSAGE = 'Zadejte e-mail ve tvaru jan.novak@external.test.'
/* A request without a single uploaded artwork cannot come from the page, which keeps _Odeslat
   díla_ until one has uploaded; not yet through the copywriter. */
export const NO_ARTWORKS_MESSAGE = 'Vyberte aspoň jedno dílo.'

/** The script's own shape check: the Mailer refuses what this lets through anyway. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function emailMessage(email: string): string | null {
  if (email === '') return EMPTY_PROVIDER_EMAIL_MESSAGE
  if (!email.includes('@')) return MISSING_AT_MESSAGE
  if (!EMAIL_SHAPE.test(email) || email.length > 254) return INVALID_EMAIL_MESSAGE
  return null
}

/** One card as the form sent it: the uploaded file's ID and its two optional fields. */
export type ArtworkInput = { author: string; id: number; source: string }

export type ProviderInput = { email: string; name: string }

export type ArtworksInput = { artworks: readonly ArtworkInput[]; provider: ProviderInput }

/**
 * Where an error belongs: a provider field, a card's field by its 1-based number, or the group of
 * artworks. The summary on top lists them in this order.
 */
export type ArtworkFieldKey =
  | 'artworks'
  | 'provider-email'
  | 'provider-name'
  | `artwork-${number}-author`
  | `artwork-${number}-source`

export type ArtworkFieldError = { key: ArtworkFieldKey; message: string }

export type ArtworksCheck =
  | { batch: { artworks: ArtworkInput[]; provider: ProviderInput }; ok: true }
  | { errors: ArtworkFieldError[]; ok: false }

/** The form's rules, the same in the browser and on the server. */
export function checkArtworks(input: ArtworksInput): ArtworksCheck {
  let provider = {
    email: input.provider.email.normalize('NFC').trim(),
    name: input.provider.name.normalize('NFC').trim(),
  }
  let artworks = input.artworks.map((artwork) => ({
    author: artwork.author.normalize('NFC').trim(),
    id: artwork.id,
    source: artwork.source.normalize('NFC').trim(),
  }))

  let errors: ArtworkFieldError[] = []
  if (provider.name === '')
    errors.push({ key: 'provider-name', message: EMPTY_PROVIDER_NAME_MESSAGE })
  else if ([...provider.name].length > MAX_PROVIDER_NAME_LENGTH) {
    errors.push({ key: 'provider-name', message: LONG_PROVIDER_NAME_MESSAGE })
  }
  let message = emailMessage(provider.email)
  if (message !== null) errors.push({ key: 'provider-email', message })

  artworks.forEach((artwork, index) => {
    let number = index + 1
    if ([...artwork.author].length > MAX_ARTWORK_AUTHOR_LENGTH) {
      errors.push({ key: `artwork-${number}-author`, message: LONG_ARTWORK_AUTHOR_MESSAGE })
    }
    let sourceMessage = checkSource(artwork.source)
    if (sourceMessage !== null) {
      errors.push({ key: `artwork-${number}-source`, message: sourceMessage })
    }
  })

  if (artworks.length === 0) errors.push({ key: 'artworks', message: NO_ARTWORKS_MESSAGE })
  else if (artworks.length > MAX_ARTWORKS) errors.push({ key: 'artworks', message: TOO_MANY_NOTE })

  if (errors.length > 0) return { errors, ok: false }
  return { batch: { artworks, provider }, ok: true }
}

/** The label of the field an error points at, for the summary's links. */
export function artworkFieldLabel(key: ArtworkFieldKey): string {
  if (key === 'provider-name') return PROVIDER_NAME_LABEL
  if (key === 'provider-email') return PROVIDER_EMAIL_LABEL
  if (key === 'artworks') return ARTWORKS_LEGEND
  let match = /^artwork-(\d+)-(author|source)$/.exec(key)
  let number = match?.[1] ?? ''
  return match?.[2] === 'source' ? `Zdroj díla ${number}` : `Autor díla ${number}`
}

/* `21a`. */
export const ARTWORKS_PAGE_TITLE = 'Nahrání obrazových děl'
export const ARTWORKS_PAGE_LEAD = tied`Nahrajte díla k publikaci. Po odeslání pošleme na uvedenou adresu žádost o souhlas. Souhlas se dává odpovědí přesně „Souhlasím“.`

export function articleBadge(articleName: string): string {
  return tied`K článku ${articleName}`
}

/** `21a`: the same badge for an artwork group's link (#133). */
export function groupBadge(groupName: string): string {
  return tied`Ke skupině ${groupName}`
}

export const PROVIDER_LEGEND = 'Kdo díla poskytuje'
export const PROVIDER_HINT = tied`Uveďte jméno a e-mail osoby, která dává souhlas s užitím děl. Autora díla uvedete u každého díla zvlášť.`
export const PROVIDER_NAME_LABEL = tied`Jméno a příjmení`
export const PROVIDER_EMAIL_LABEL = 'E-mail'
export const PROVIDER_EMAIL_HINT = tied`Na tuto adresu pošleme žádost o souhlas.`
export const ARTWORKS_LEGEND = 'Díla'
export const ARTWORKS_HINT = tied`JPG, PNG, TIFF, WebP i fotky z iPhonu (HEIC). Nejvýše 20 děl, každé do 15 MB.`
export const ARTWORK_AUTHOR_LABEL = 'Autor díla'
export const ARTWORK_AUTHOR_HINT = 'Bez autora dílo vyjde bez podpisu.'
export const ARTWORK_SOURCE_LABEL = 'Zdroj, odkaz přímo na dílo'
export const REMOVE_ARTWORK_LABEL = 'Odebrat'
export const CHOOSE_HINT = tied`Vyfoťte nebo vyberte z galerie. Víc obrázků najednou jde.`
export const CHOOSE_LABEL = 'Vybrat díla'
export const DROP_LEAD = 'Přetáhněte díla sem, nebo'
export const SUBMIT_ARTWORKS_LABEL = 'Odeslat díla'
export const SUBMITTING_ARTWORKS_LABEL = 'Díla se odesílají…'
export const UPLOADED_LABEL = 'nahráno'

export function artworkCardTitle(number: number): string {
  return `Dílo ${number}`
}

export function cancelUploadName(fileName: string): string {
  return `Zrušit nahrávání ${fileName}`
}

export function removeArtworkName(number: number): string {
  return `Odebrat dílo ${number}`
}

/** `Pusťte 1 soubor sem`, `Pusťte 2 soubory sem`, `Pusťte 5 souborů sem`. */
export function dropLine(count: number): string {
  let noun = count === 1 ? 'soubor' : count >= 2 && count <= 4 ? 'soubory' : 'souborů'
  return `Pusťte ${count} ${noun} sem`
}

export function waitingForUploadNote(number: number): string {
  return `Odeslat půjde, až se dohraje dílo ${number}.`
}

/** Under the heading when the page's script never started (`21a`, _Skript stránky neběží_). */
export const SCRIPT_MISSING_WARNING = tied`Načtěte stránku znovu, nebo odkaz otevřete v jiném prohlížeči. Díla tu teď nejde nahrát.`

/* `21d`: a step as the Callout's title, the result under it. */
export type ArtworksMessage = { text: string; title: string }

export const LINK_GONE_AFTER_UPLOAD: ArtworksMessage = {
  text: 'Tento odkaz mezitím přestal platit. Nahrávání se nedokončilo. Vyplněné údaje si můžete zkopírovat.',
  title: 'Pokud díla ještě potřebujete poslat, napište šéfredakci.',
}

/** In place of _Odeslat díla_ once nothing more can be sent from the page (`21d`). */
export const SENDING_CLOSED_LINE = tied`Díla už z tohoto odkazu nelze odeslat. Další postup najdete nahoře na stránce. Neodeslané soubory přesuneme do 24 hodin do koše sdíleného disku.`

/**
 * The upload endpoint's answer, which the island reads. `unreadable` is a file stored and counted
 * that is no image the server recognises; the rest store nothing.
 */
export type UploadReply =
  | { artwork: { id: number; name: string; size: number }; outcome: 'uploaded' }
  | { artwork: { id: number; name: string; size: number }; outcome: 'unreadable' }
  | { outcome: 'disconnected' }
  | { outcome: 'folder-gone' }
  | { outcome: 'limited' }
  | { outcome: 'link-gone' }
  | { outcome: 'not-image' }
  | { outcome: 'refused' }
  | { outcome: 'too-large' }
  | { outcome: 'unavailable' }

/** The header the island names the page's form key in, and the one it names the file in. */
export const FORM_KEY_HEADER = 'X-Form-Key'
export const FILE_NAME_HEADER = 'X-File-Name'

/* `21a`: the warnings under the lead, checked when the page opens (`dkssdpyc`, `1jv85zum`), and
   said on a card whose upload met the same. */
export const ARTWORKS_DISCONNECTED_WARNING =
  'Zkuste díla nahrát později, nebo dejte vědět šéfredakci.'
export const ARTWORKS_FOLDER_GONE_WARNING = tied`Zkuste to později. Z tohoto odkazu teď nejde díla nahrát ani odeslat.`
/** The card of a file chosen while a folder is missing: the server refused it (`21a`). */
export const UPLOAD_FOLDER_GONE_TEXT = tied`Zkuste to později. Soubor se nenahrál a díla teď nejde odeslat.`

/* The design system's `UploadStatus`, in its own words (`bxy8xxqs`). */
export const UPLOADING_LABEL = 'Nahrává se'
export const CANCEL_UPLOAD_LABEL = 'Zrušit'
