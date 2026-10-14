import {
  type FieldMetadata,
  type FormMetadata,
  getInputProps,
  getSelectProps,
} from '@conform-to/react'
import { useState } from 'react'
import type { z } from 'zod'

import { Button } from '~/components/button'
import { Select } from '~/components/select'
import { TextField } from '~/components/text-field'
import { slugify } from '~/utils/slugify'
import { useAutoSlug } from '~/utils/use-auto-slug'
import type { TaxonomyRecordCopy } from '../../utils/taxonomy-record-copy'
import type { taxonomyRecordSchema } from '../../utils/taxonomy-record-schema'
import styles from './_styles.module.css'

type Author = {
  id: string
  name: string
}

type Value = z.output<typeof taxonomyRecordSchema>

type Props = {
  copy: TaxonomyRecordCopy
  form: FormMetadata<Value, string[]>
  fields: {
    [Name in keyof Required<Value>]: FieldMetadata<Value[Name], Value, string[]>
  }
  authors: Author[] | null
  slugSuggestion: string | null
  followsName: boolean
  publishedSlug: string | null
}

/**
 * A category's or tag's fields in its dialog (design 25c): Název, Adresa with
 * the full public address as its hint, and Autor for the Coordinator.
 *
 * @param props.authors - The authors to pick from, for the Coordinator only;
 *   `null` hides the field and the server sets the author.
 * @param props.slugSuggestion - A free address the server offers for a taken
 *   one, put into the field with „Použít …“.
 * @param props.followsName - The address fills from the name until the author
 *   types in it (a new record).
 * @param props.publishedSlug - The address of a draft published before: a
 *   different one warns that the old address stops working.
 */
export const TaxonomyRecordFields = ({
  copy,
  form,
  fields,
  authors,
  slugSuggestion,
  followsName,
  publishedSlug,
}: Props) => {
  const [name, setName] = useState(fields.name.initialValue ?? '')
  const autoSlug = useAutoSlug({
    fieldName: fields.slug.name,
    sourceValue: followsName ? name : undefined,
    updateFieldValue: form.update,
  })

  const slug = slugify(fields.slug.value ?? '')
  const canUseSuggestion =
    slugSuggestion !== null &&
    fields.slug.errors !== undefined &&
    slug !== slugSuggestion
  const isSlugChanged = publishedSlug !== null && slug !== publishedSlug

  return (
    <>
      <TextField
        label={'Název'}
        onChange={(event) => setName(event.target.value)}
        {...getInputProps(fields.name, { type: 'text' })}
        errors={fields.name.errors}
      />

      <div className={styles.slugField}>
        <TextField
          label={'Adresa'}
          onBlur={autoSlug.handleBlur}
          onFocus={autoSlug.handleFocus}
          onInput={autoSlug.handleInput}
          {...getInputProps(fields.slug, { type: 'text' })}
          errors={fields.slug.errors}
          hint={
            isSlugChanged ? (
              <>
                {copy.republishHint}
                <span className={styles.originalAddress}>
                  Původní adresa: {copy.publicPath}/{publishedSlug}
                </span>
              </>
            ) : (
              `${copy.publicPath}/${slug}`
            )
          }
        />
        {canUseSuggestion && (
          <Button
            onClick={() => {
              // A chosen address no longer follows the name.
              autoSlug.handleInput()
              form.update({ name: fields.slug.name, value: slugSuggestion })
            }}
            size={'sm'}
            type={'button'}
            variant={'outline'}
          >
            Použít {slugSuggestion}
          </Button>
        )}
      </div>

      {authors !== null && (
        <Select
          label={'Autor'}
          {...getSelectProps(fields.authorId)}
          errors={fields.authorId.errors}
        >
          {authors.map((author) => (
            <option key={author.id} value={author.id}>
              {author.name}
            </option>
          ))}
        </Select>
      )}
    </>
  )
}
