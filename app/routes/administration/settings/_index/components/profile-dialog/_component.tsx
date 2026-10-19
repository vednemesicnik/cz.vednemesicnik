import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { type ChangeEvent, useEffect, useRef, useState } from 'react'
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
  // Set once a confirm let the profile go, so the close is not asked again.
  const mayCloseRef = useRef(false)
  // Esc and the footer's Zrušit ask while the photo uploads.
  const ref = useModalDialog(onClose, {
    shouldStayOpen: () => {
      if (mayCloseRef.current || !photo.isUploading) return false
      setConfirm((current) => current ?? 'close')
      return true
    },
  })
  const profileFetcher = useFetcher<typeof settingsAction>()
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLElement>(null)

  // Leaving Nastavení cancels the upload, so it asks (29b).
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      photo.isUploading && currentLocation.pathname !== nextLocation.pathname,
  )

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

  // Focus goes to the row's Zrušit on the pick, and back to *Vybrat fotku*
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
      mayCloseRef.current = true
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
      ? 'Fotku se nepodařilo nahrát.'
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

          <section aria-label={'Fotka'} className={styles.photo} ref={photoRef}>
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
                Nepovinná. Nejvýš 5 MB. Zobrazuje se v kruhu.
              </p>
              {/* The row stands in place of the links (29b). */}
              {photo.isUploading ? (
                <UploadStatus
                  cancelLabel={'Zrušit nahrávání fotky'}
                  onCancel={() => void photo.cancel()}
                />
              ) : (
                <div className={styles.photoActions}>
                  <Button
                    data-pick-photo={true}
                    disabled={photo.isRemoving}
                    onClick={() => fileInputRef.current?.click()}
                    type={'button'}
                    variant={'outline'}
                  >
                    Vybrat fotku
                  </Button>
                  {hasImage && (
                    <TextButton
                      disabled={photo.isRemoving}
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
                Nová fotka se uloží po nahrání, odebrání platí hned. Zavřením
                dialogu se uložená změna fotky nevrátí.
              </p>
              <span className={'screen-reader-only'} role={'status'}>
                {photo.announcement}
              </span>
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
              field={fields.bio}
              hint={
                <>
                  <span>Zatím se na webu nezobrazuje.</span>
                  <span>
                    {bioLength} / {BIO_MAX_LENGTH}
                  </span>
                </>
              }
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
                size={'sm'}
                type={'button'}
                variant={'ghost'}
              >
                Zrušit
              </Button>
              <Button disabled={isSubmitting} size={'sm'} type={'submit'}>
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
          onConfirm={handleConfirm}
          onStay={() => setConfirm(null)}
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
                Fotka se ještě nahrává. Po zavření se její nahrávání zruší.
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
          onStay={() => setConfirm(null)}
          stayLabel={'Zůstat'}
          title={
            photo.isUploading
              ? 'Zrušit nahrávání a uložit profil?'
              : 'Uložit profil?'
          }
        >
          <AdminModalDescription>
            {photo.isUploading
              ? 'Fotka se ještě nahrává. Po potvrzení se její nahrávání zruší, jméno a bio se uloží a profil se zavře.'
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
          onStay={() => blocker.reset()}
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
                Fotka se ještě nahrává. Po odchodu se její nahrávání zruší.
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
