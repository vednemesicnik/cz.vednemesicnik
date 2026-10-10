import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { useFetcher } from 'react-router'

import { AdminAvatar } from '~/components/admin/admin-avatar'
import { AdminInput } from '~/components/admin/admin-input'
import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AdminTextarea } from '~/components/admin/admin-textarea'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { Button } from '~/components/button'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { FORM_CONFIG } from '~/config/form-config'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import type { action as settingsAction } from '../../_action'
import {
  BIO_MAX_LENGTH,
  MAX_PROFILE_IMAGE_SIZE,
  profileSchema,
} from '../../_schema'
import { useModalDialog } from '../../utils/use-modal-dialog'
import { TextButton } from '../text-button'
import styles from './_styles.module.css'

type Props = {
  name: string
  bio: string
  image: ImageSources
  imageAlt: string
  hasImage: boolean
  onClose: () => void
}

/**
 * What a person may change about themselves (design 29b): the photo, which
 * is saved as soon as it is picked or removed, and the author's name and bio,
 * saved with „Uložit“.
 */
export const ProfileDialog = ({
  name,
  bio,
  image,
  imageAlt,
  hasImage,
  onClose,
}: Props) => {
  // A photo still uploading would be saved but never shown: stay open for it.
  const ref = useModalDialog(onClose, {
    shouldStayOpen: () => imageFetcher.state !== 'idle',
  })
  const profileFetcher = useFetcher<typeof settingsAction>()
  const imageFetcher = useFetcher<typeof settingsAction>()
  const authenticityToken = useAuthenticityToken()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localImageError, setLocalImageError] = useState<string | null>(null)

  const lastResult =
    profileFetcher.data !== undefined &&
    'submissionResult' in profileFetcher.data
      ? profileFetcher.data.submissionResult
      : undefined

  const [form, fields] = useForm({
    constraint: getZodConstraint(profileSchema),
    defaultValue: { bio, name },
    id: 'profile',
    lastResult,
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

  const serverImageError =
    imageFetcher.state === 'idle' &&
    imageFetcher.data !== undefined &&
    'imageError' in imageFetcher.data
      ? imageFetcher.data.imageError
      : null
  const imageError = localImageError ?? serverImageError

  const submitImageIntent = (intent: string, file?: File) => {
    const formData = new FormData()
    formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
    formData.append(FORM_CONFIG.intent.name, intent)

    if (file !== undefined) {
      formData.append('image', file)
    }

    void imageFetcher.submit(formData, {
      encType: file !== undefined ? 'multipart/form-data' : undefined,
      method: 'POST',
    })
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Let the same file be picked again after an error.
    event.target.value = ''

    if (file === undefined) return

    if (!file.type.startsWith('image/')) {
      setLocalImageError('Vyberte obrázek — tento soubor není obrázek.')
      return
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setLocalImageError('Vyberte obrázek do 5 MB — tento je příliš velký.')
      return
    }

    setLocalImageError(null)
    submitImageIntent(FORM_CONFIG.intent.value.uploadImage, file)
  }

  const handleRemoveImage = () => {
    setLocalImageError(null)
    submitImageIntent(FORM_CONFIG.intent.value.deleteImage)
  }

  const bioLength = fields.bio.value?.length ?? 0
  const isSubmitting = profileFetcher.state !== 'idle'
  const isImageBusy = imageFetcher.state !== 'idle'
  const handleCancel = () => ref.current?.close()

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent className={styles.content}>
        <AdminModalTitle>Upravit profil</AdminModalTitle>

        <section aria-label={'Fotka'} className={styles.photo}>
          <AdminAvatar
            alt={imageAlt}
            image={image}
            name={name}
            size={'small'}
          />
          <div className={styles.photoControls}>
            <p className={styles.hint}>
              Nepovinná. Nejvýš 5 MB. Zobrazuje se v kruhu.
            </p>
            <div className={styles.photoActions}>
              <Button
                disabled={isImageBusy}
                onClick={() => fileInputRef.current?.click()}
                type={'button'}
                variant={'outline'}
              >
                Vybrat fotku
              </Button>
              {hasImage && (
                <TextButton disabled={isImageBusy} onClick={handleRemoveImage}>
                  Odebrat
                </TextButton>
              )}
              <input
                accept={'image/*'}
                hidden
                onChange={handleFileChange}
                ref={fileInputRef}
                type={'file'}
              />
            </div>
            {imageError !== null && (
              <ErrorMessageGroup>
                <ErrorMessage>{imageError}</ErrorMessage>
              </ErrorMessageGroup>
            )}
            <p className={styles.hint}>
              Změna i odebrání fotky se uloží hned a tlačítko Zrušit je nevrátí.
            </p>
          </div>
        </section>

        <profileFetcher.Form
          className={styles.form}
          method={'post'}
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

          <AdminInput
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
              disabled={isSubmitting || isImageBusy}
              onClick={handleCancel}
              type={'button'}
              variant={'outline'}
            >
              Zrušit
            </Button>
            <Button disabled={isSubmitting} type={'submit'}>
              Uložit
            </Button>
          </AdminModalActions>
        </profileFetcher.Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
