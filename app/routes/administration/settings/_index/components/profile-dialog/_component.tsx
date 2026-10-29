import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { type ChangeEvent, useEffect, useId, useRef, useState } from 'react'
import { useBlocker, useFetcher } from 'react-router'
import type { z } from 'zod'

import { AdminAvatar } from '~/components/admin/admin-avatar'
import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AdminTextarea } from '~/components/admin/admin-textarea'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { TextField } from '~/components/text-field'
import { UploadStatus } from '~/components/upload-status'
import { FORM_CONFIG } from '~/config/form-config'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import { useModalDialog } from '~/utils/use-modal-dialog'
import type { action as settingsAction } from '../../_action'
import { BIO_MAX_LENGTH, profileSchema } from '../../_schema'
import { useProfilePhoto } from '../../utils/use-profile-photo'
import { TextButton } from '../text-button'
import { UploadConfirmDialog } from '../upload-confirm-dialog'
import styles from './_styles.module.css'

// The picked file in the avatar while it uploads (29b).
const toPreviewSources = (previewUrl: string): ImageSources => ({
  avifSrcSet: undefined,
  height: undefined,
  placeholder: undefined,
  src: previewUrl,
  srcSet: undefined,
  width: undefined,
})

type Props = {
  name: string
  bio: string
  image: ImageSources
  imageAlt: string
  hasImage: boolean
  onClose: () => void
}

// What asks over the profile while the photo uploads (29b).
type Confirm = 'close' | 'save'

/**
 * What a person may change about themselves (design 29b): the photo, which
 * is saved as soon as it is picked or removed, and the author's name and bio,
 * saved with „Uložit“. The photo's upload shows one row with *Zrušit* and can
 * be cancelled until it saves; closing the profile, saving it or leaving
 * Nastavení meanwhile asks first, because it cancels the upload (yyxgpzr2,
 * o9j577ga; copy axz8tav5).
 */
export const ProfileDialog = ({
  name,
  bio,
  image,
  imageAlt,
  hasImage,
  onClose,
}: Props) => {
  const photo = useProfilePhoto({ hasImage, imageSource: image.src })
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  // A close the browser no longer lets the page cancel (Esc again without a
  // click between) reopens the profile over the confirm: a new key opens the
  // confirm again on top.
  const [closeConfirmKey, setCloseConfirmKey] = useState(0)
  // Set once a confirm let the profile go, so the close is not asked again.
  const mayCloseRef = useRef(false)
  // Without a click between, the browser closes the profile together with a
  // confirm whose Esc meant Zůstat: for that moment the profile stays, and
  // focus goes where the confirm sends it.
  const stayFocusRef = useRef<Element | null | undefined>(undefined)
  // Set while an Esc a confirm received travels on to the profile.
  const handedOnRef = useRef(false)
  // Esc and the footer's Zrušit ask while the photo uploads.
  const ref = useModalDialog(onClose, {
    shouldStayOpen: () => {
      if (stayFocusRef.current !== undefined) {
        const target = stayFocusRef.current
        setTimeout(() => returnFocus(target))
        return true
      }
      if (mayCloseRef.current) return false
      // An Esc the browser hands on from a confirm was that confirm's.
      if (handedOnRef.current) return true
      // A close the page could not cancel reopens the profile over the
      // confirm the same Esc opened: open it again on top.
      if (confirm !== null || blocker.state === 'blocked') {
        setCloseConfirmKey((key) => key + 1)
        return true
      }
      if (!photo.isUploading) return false
      setConfirm('close')
      setCloseConfirmKey((key) => key + 1)
      return true
    },
  })
  const profileFetcher = useFetcher<typeof settingsAction>()
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLElement>(null)
  const photoLabelId = useId()
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const saveButtonRef = useRef<HTMLButtonElement>(null)
  // Where focus was in the profile when a leave was blocked.
  const leaveFocusRef = useRef<Element | null>(null)

  useEffect(() => {
    const handleCancel = (event: Event) => {
      if (event.target === ref.current) return
      handedOnRef.current = true
      setTimeout(() => {
        handedOnRef.current = false
      })
    }
    document.addEventListener('cancel', handleCancel, true)
    return () => document.removeEventListener('cancel', handleCancel, true)
  }, [ref])

  // Leaving Nastavení cancels the upload, so it asks (29b).
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    const shouldBlock =
      photo.isUploading && currentLocation.pathname !== nextLocation.pathname
    if (shouldBlock) leaveFocusRef.current = document.activeElement
    return shouldBlock
  })

  const lastResult =
    profileFetcher.data !== undefined &&
    'submissionResult' in profileFetcher.data
      ? profileFetcher.data.submissionResult
      : undefined

  const [form, fields] = useForm<z.infer<typeof profileSchema>>({
    constraint: getZodConstraint(profileSchema),
    defaultValue: { bio, name },
    id: 'profile',
    lastResult,
    // Uložit asks first while the photo uploads; name and bio save after.
    onSubmit: (event, { submission }) => {
      if (submission?.status === 'success' && photo.isUploading) {
        event.preventDefault()
        setConfirm('save')
      }
    },
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: profileSchema }),
    shouldRevalidate: 'onInput',
    shouldValidate: 'onBlur',
  })

  const isSaved =
    profileFetcher.data !== undefined &&
    'status' in profileFetcher.data &&
    profileFetcher.data.status === 'profile-saved'

  useEffect(() => {
    if (isSaved) {
      ref.current?.close()
    }
  }, [isSaved, ref])

  // Focus goes to the row's Zrušit on the pick, and back to *Vybrat obrázek*
  // once the upload ended, unless it is somewhere else by then (a confirm).
  const wasUploadingRef = useRef(false)
  useEffect(() => {
    const wasUploading = wasUploadingRef.current
    wasUploadingRef.current = photo.isUploading
    if (photo.isUploading === wasUploading) return

    if (photo.isUploading) {
      photoRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
      return
    }

    const focused = document.activeElement
    if (
      focused === null ||
      focused === document.body ||
      photoRef.current?.contains(focused)
    ) {
      photoRef.current
        ?.querySelector<HTMLButtonElement>('[data-pick-photo]')
        ?.focus()
    }
  }, [photo.isUploading])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Let the same file be picked again after an error.
    event.target.value = ''

    if (file !== undefined) void photo.pick(file)
  }

  const closeProfile = () => {
    mayCloseRef.current = true
    ref.current?.close()
  }

  const handleConfirm = () => {
    const trigger = confirm
    setConfirm(null)
    if (photo.isUploading) void photo.cancel()

    if (trigger === 'save') {
      if (formRef.current !== null) {
        void profileFetcher.submit(formRef.current, { method: 'post' })
      }
      return
    }

    closeProfile()
  }

  const handleLeave = () => {
    if (photo.isUploading) void photo.cancel()
    mayCloseRef.current = true
    blocker.proceed?.()
  }

  // Zůstat or Esc in a confirm: back where the person asked from (29b). A
  // target gone by then (the row, once the upload ended) falls back to the
  // photo's first control.
  const returnFocus = (target: Element | null) => {
    if (target instanceof HTMLElement && target.isConnected) {
      target.focus()
      return
    }
    photoRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
  }

  // Zůstat or Esc in a confirm.
  const stay = (target: Element | null) => {
    stayFocusRef.current = target
    setTimeout(() => {
      stayFocusRef.current = undefined
    })
    returnFocus(target)
  }

  const bioLength = fields.bio.value?.length ?? 0
  const isSubmitting = profileFetcher.state !== 'idle'
  const handleCancel = () => {
    if (photo.isUploading) {
      setConfirm('close')
      return
    }
    ref.current?.close()
  }

  // The confirms' words: while it uploads, after it saved, or after it failed.
  // The sentence about name and bio only when they were changed (axz8tav5).
  const outcomeSentence =
    photo.lastOutcome === 'failed'
      ? 'Obrázek se nepodařilo nahrát.'
      : 'Nahrávání je dokončeno.'
  const discardSentence = 'Změny jména a bia se neuloží.'
  // Against the stored values; the form's own `dirty` counts its hidden inputs.
  const isProfileChanged =
    (fields.name.value ?? '') !== name || (fields.bio.value ?? '') !== bio

  return (
    <>
      <AdminDialog ref={ref}>
        <AdminModalContent>
          <AdminModalTitle>Upravit profil</AdminModalTitle>

          {/* Labelled like Jméno and Bio, and the label names the section (bqj3ueme). */}
          <section
            aria-labelledby={photoLabelId}
            className={styles.photoField}
            ref={photoRef}
          >
            <span className={styles.photoLabel} id={photoLabelId}>
              Profilový obrázek{' '}
              <span className={styles.optional}>nepovinný</span>
            </span>
            <div className={styles.photo}>
              <AdminAvatar
                alt={imageAlt}
                className={photo.upload !== null ? styles.uploading : undefined}
                image={
                  photo.upload !== null
                    ? toPreviewSources(photo.upload.previewUrl)
                    : image
                }
                name={name}
                size={'small'}
              />
              <div className={styles.photoControls}>
                <p className={styles.hint}>
                  Nejvýš 5 MB. Zobrazuje se v kruhu.
                </p>
                {/* The row stands in place of the links (29b). */}
                {photo.isUploading ? (
                  <UploadStatus
                    cancelLabel={'Zrušit nahrávání obrázku'}
                    onCancel={() => void photo.cancel()}
                  />
                ) : (
                  <div className={styles.photoActions}>
                    <Button
                      data-pick-photo={true}
                      disabled={photo.isRemoving || photo.isCancelling}
                      onClick={() => fileInputRef.current?.click()}
                      type={'button'}
                      variant={'outline'}
                    >
                      Vybrat obrázek
                    </Button>
                    {hasImage && (
                      <TextButton
                        disabled={photo.isRemoving || photo.isCancelling}
                        onClick={() => void photo.remove()}
                      >
                        Odebrat
                      </TextButton>
                    )}
                  </div>
                )}
                <input
                  accept={'image/*'}
                  hidden
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  type={'file'}
                />
                {photo.imageError !== null && (
                  <ErrorMessageGroup>
                    <ErrorMessage>{photo.imageError}</ErrorMessage>
                  </ErrorMessageGroup>
                )}
                <p className={styles.hint}>
                  Obrázek se uloží po nahrání, odebrání platí hned. Zavřením
                  dialogu se uložená změna nevrátí.
                </p>
                <span className={'screen-reader-only'} role={'status'}>
                  {photo.announcement}
                </span>
              </div>
            </div>
          </section>

          <profileFetcher.Form
            className={styles.form}
            method={'post'}
            ref={formRef}
            {...getFormProps(form)}
          >
            <AuthenticityTokenInput />
            <input
              name={FORM_CONFIG.intent.name}
              type={'hidden'}
              value={FORM_CONFIG.intent.value.updateProfile}
            />

            {form.errors !== undefined && form.errors.length > 0 && (
              <ErrorMessageGroup>
                {form.errors.map((error) => (
                  <ErrorMessage key={error}>{error}</ErrorMessage>
                ))}
              </ErrorMessageGroup>
            )}

            <TextField
              label={'Jméno'}
              {...getInputProps(fields.name, { type: 'text' })}
              disabled={isSubmitting}
              errors={fields.name.errors}
              hint={'Zobrazuje se u článků na webu a v panelu administrace.'}
            />
            <AdminTextarea
              counter={`${bioLength} / ${BIO_MAX_LENGTH}`}
              field={fields.bio}
              hint={'Zatím se na webu nezobrazuje.'}
              label={
                <>
                  Bio <span className={styles.optional}>nepovinné</span>
                </>
              }
              textareaProps={{ disabled: isSubmitting, rows: 4 }}
            />

            <AdminModalActions>
              <Button
                disabled={isSubmitting}
                onClick={handleCancel}
                ref={cancelButtonRef}
                size={'sm'}
                type={'button'}
                variant={'ghost'}
              >
                Zrušit
              </Button>
              <Button
                disabled={isSubmitting}
                ref={saveButtonRef}
                size={'sm'}
                type={'submit'}
              >
                Uložit
              </Button>
            </AdminModalActions>
          </profileFetcher.Form>
        </AdminModalContent>
      </AdminDialog>

      {confirm === 'close' && (
        <UploadConfirmDialog
          confirmLabel={
            photo.isUploading ? 'Zrušit nahrávání a zavřít' : 'Zavřít'
          }
          isDanger={photo.isUploading}
          key={closeConfirmKey}
          onConfirm={handleConfirm}
          onStay={() => {
            setConfirm(null)
            stay(cancelButtonRef.current)
          }}
          stayLabel={'Zůstat'}
          title={
            photo.isUploading
              ? 'Zrušit nahrávání a zavřít profil?'
              : 'Zavřít profil?'
          }
        >
          {photo.isUploading ? (
            <>
              <AdminModalDescription>
                Obrázek se ještě nahrává. Po zavření se nahrávání zruší.
              </AdminModalDescription>
              {isProfileChanged && (
                <AdminModalDescription>{discardSentence}</AdminModalDescription>
              )}
            </>
          ) : (
            <AdminModalDescription>
              {isProfileChanged
                ? `${outcomeSentence} ${discardSentence}`
                : outcomeSentence}
            </AdminModalDescription>
          )}
        </UploadConfirmDialog>
      )}

      {confirm === 'save' && (
        <UploadConfirmDialog
          confirmLabel={
            photo.isUploading
              ? 'Zrušit nahrávání a uložit profil'
              : 'Uložit profil'
          }
          isDanger={photo.isUploading}
          onConfirm={handleConfirm}
          onStay={() => {
            setConfirm(null)
            stay(saveButtonRef.current)
          }}
          stayLabel={'Zůstat'}
          title={
            photo.isUploading
              ? 'Zrušit nahrávání a uložit profil?'
              : 'Uložit profil?'
          }
        >
          <AdminModalDescription>
            {photo.isUploading
              ? 'Obrázek se ještě nahrává. Po potvrzení se nahrávání zruší, jméno a bio se uloží a profil se zavře.'
              : `${outcomeSentence} Po potvrzení se jméno a bio uloží a profil se zavře.`}
          </AdminModalDescription>
        </UploadConfirmDialog>
      )}

      {blocker.state === 'blocked' && (
        <UploadConfirmDialog
          confirmLabel={
            photo.isUploading ? 'Zrušit nahrávání a odejít' : 'Odejít'
          }
          isDanger={photo.isUploading}
          onConfirm={handleLeave}
          onStay={() => {
            blocker.reset?.()
            stay(leaveFocusRef.current)
          }}
          stayLabel={'Zůstat v Nastavení'}
          title={
            photo.isUploading
              ? 'Zrušit nahrávání a odejít?'
              : 'Odejít z Nastavení?'
          }
        >
          {photo.isUploading ? (
            <>
              <AdminModalDescription>
                Obrázek se ještě nahrává. Po odchodu se nahrávání zruší.
              </AdminModalDescription>
              {isProfileChanged && (
                <AdminModalDescription>{discardSentence}</AdminModalDescription>
              )}
            </>
          ) : (
            <AdminModalDescription>
              {isProfileChanged
                ? `${outcomeSentence} ${discardSentence}`
                : outcomeSentence}
            </AdminModalDescription>
          )}
        </UploadConfirmDialog>
      )}
    </>
  )
}
