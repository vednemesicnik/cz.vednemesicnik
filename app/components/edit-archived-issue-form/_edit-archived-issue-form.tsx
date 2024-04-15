import { Form } from "@remix-run/react"
import { formFields } from "./_form-fields"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

type Props = {
  id: string
  ordinalNumber: string
  publishedAt: string
  published: boolean
  coverId?: string
  pdfId?: string
}

export const EditArchivedIssueForm = ({ coverId, pdfId, published, publishedAt, id, ordinalNumber }: Props) => {
  return (
    <Form method={"post"} encType={"multipart/form-data"}>
      <input hidden={true} name={formFields.issueId.name} defaultValue={id} />
      <fieldset>
        <legend>Popis</legend>
        <label htmlFor={formFields.ordinalNumber.id}>Číslo výtisku</label>
        <input
          required={true}
          type="number"
          name={formFields.ordinalNumber.name}
          id={formFields.ordinalNumber.id}
          min={1}
          step={1}
          defaultValue={ordinalNumber ?? 1}
        />
        <br />
        <label htmlFor={formFields.publishedAt.id}>Datum vydání</label>
        <input
          type="date"
          name={formFields.publishedAt.name}
          id={formFields.publishedAt.id}
          defaultValue={publishedAt}
          required={true}
        />
      </fieldset>
      <fieldset>
        <legend>Soubory</legend>
        <label htmlFor={formFields.cover.id}>Obálka výtisku</label>
        <input type="file" name={formFields.cover.name} id={formFields.cover.id} accept={"image/*"} />
        <input hidden={true} name={formFields.coverId.name} defaultValue={coverId} />
        <br />
        <label htmlFor={formFields.pdf.id}>PDF výtisku</label>
        <input type="file" name={formFields.pdf.name} id={formFields.pdf.id} accept="application/pdf" />
        <input hidden={true} name={formFields.pdfId.name} defaultValue={pdfId} />
      </fieldset>
      <fieldset>
        <legend>Stav</legend>
        <label htmlFor={formFields.published.options.published.id}>Zveřejněno</label>
        <input
          type="radio"
          name={formFields.published.name}
          id={formFields.published.options.published.id}
          value="true"
          defaultChecked={published}
        />
        <br />
        <label htmlFor={formFields.published.options.notPublished.id}>Nezveřejněno</label>
        <input
          type="radio"
          name={formFields.published.name}
          id={formFields.published.options.notPublished.id}
          value="false"
          defaultChecked={!published}
        />
      </fieldset>
      <AuthenticityTokenInput />
      <br />
      <button type="submit">Upravit</button>
    </Form>
  )
}
