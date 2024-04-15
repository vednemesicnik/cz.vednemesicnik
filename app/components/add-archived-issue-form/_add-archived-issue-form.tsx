import { Form } from "@remix-run/react"
import { formFields } from "./_form-fields"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

export const AddArchivedIssueForm = () => {
  return (
    <Form method={"post"} encType={"multipart/form-data"}>
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
          defaultValue={1}
        />
        <br />
        <label htmlFor={formFields.publishedAt.id}>Datum vydání</label>
        <input
          type="date"
          name={formFields.publishedAt.name}
          id={formFields.publishedAt.id}
          defaultValue={new Date().toISOString().split("T")[0]}
          required={true}
        />
      </fieldset>
      <fieldset>
        <legend>Soubory</legend>
        <label htmlFor={formFields.cover.id}>Obálka výtisku</label>
        <input type="file" name={formFields.cover.name} id={formFields.cover.id} accept={"image/*"} />
        <br />
        <label htmlFor={formFields.pdf.id}>PDF výtisku</label>
        <input type="file" name={formFields.pdf.name} id={formFields.pdf.id} accept="application/pdf" />
      </fieldset>
      <fieldset>
        <legend>Stav</legend>
        <label htmlFor={formFields.published.options.published.id}>Zveřejněno</label>
        <input
          type="radio"
          name={formFields.published.name}
          id={formFields.published.options.published.id}
          value="true"
          defaultChecked={true}
        />
        <br />
        <label htmlFor={formFields.published.options.notPublished.id}>Nezveřejněno</label>
        <input
          type="radio"
          name={formFields.published.name}
          id={formFields.published.options.notPublished.id}
          value="false"
        />
      </fieldset>
      <AuthenticityTokenInput />
      <br />
      <button type="submit">Přidat</button>
    </Form>
  )
}
