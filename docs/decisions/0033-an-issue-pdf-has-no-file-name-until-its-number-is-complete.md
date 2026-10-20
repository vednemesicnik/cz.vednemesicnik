# 0033. An issue's PDF has no file name until its year and order are both there

- Status: Accepted
- Date: 2026-10-20
- Issues: #711

## Context

Since [0032](0032-a-new-archive-issue-is-a-draft-with-the-next-free-number.md) a draft may lack
its year or order. Since #711 the editor uploads the PDF as soon as it is picked (design 26c),
and that can be before the number is complete. [0030](0030-an-archive-issue-is-year-order-and-supplement-and-its-title-is-computed.md)
names the PDF by the number (`VDM-2026-4.pdf`), and `IssuePDF.fileName` was required and unique,
so a PDF uploaded without a number had no name it could get. The name is also the PDF's public
address (`/archive/:fileName`). Design 26j shows no address until the number is complete:
„Úplný náhled názvu a adresy PDF se zobrazí po doplnění roku.“

## Decision

- `IssuePDF.fileName` is nullable. A PDF uploaded before the issue has its year and order is
  stored without a name. It is also stored without one while another PDF still holds the name.
- A missing name means no address yet. The public archive and `/links` treat a PDF without a
  name as no PDF. The detail shows no *Otevřít PDF* and no address, and the editor and the detail
  show the name the file was uploaded under instead.
- The editor's save names the PDF once the number is complete (`getEditedIssuePdfFileName`
  returns a name for a draft without one). From then on 0030's rule holds: the name changes only
  with the number, and only on a draft.

## Consequences

- Code that builds the PDF's address checks for `null` first.
- #718 checks the year and order before submitting. Once it lands, a published issue always has
  a named PDF. Until then, a draft without a number that gets published stays off the public
  archive.
- The PDF card's first line without a number is provisional (the uploaded name) until design
  says otherwise.
- The current state is described in [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Alternatives considered

- **A placeholder name** (e.g. by the issue's id). It would give the PDF an address that never
  becomes the real one, the opposite of 26j.
- **No PDF upload until the number is complete.** 26j draws the files as in 26c, and the number
  may well come last.
