# 0027. Each article image saves on its own

- Status: Accepted
- Date: 2026-10-16
- Issues: #673, #667

## Context

Until #673 the gallery travelled with the editor's whole-form autosave
([0022](0022-a-document-autosaves-its-whole-form-from-the-holding-tab.md)). A picked file waited
for the next save, an image left out of the form was deleted, and the main image was a radio
button. One image that failed to process failed the whole save, text included, and a waiting file
made the save too big for the `keepalive` request a closing page sends.

Design 24b (1pdzkd57, 8kfn4ou3) draws the gallery differently. An image uploads as soon as it is
picked, each one by itself. *Odebrat*, *Nahradit soubor*, the main image and the order save at
once. Processing and failure show on the tile only in the open editor, and *Zavřít* works while an
image is still processing.

## Decision

- **Every gallery change is its own request.** It goes to the action-only route
  `/administration/articles/:articleId/images` with an intent of `upload`, `remove`, `feature` or
  `reorder`. Each one is checked against the stored article
  ([0015](0015-edits-check-the-stored-record-not-the-form.md)) and against the edit hold in its own
  conditional write ([0019](0019-the-edit-lock-lives-on-the-content-row.md)). That write also moves
  `updatedAt`, so the save line and `acknowledgeSave` treat it like any save
  ([0021](0021-an-edit-hold-belongs-to-a-page-load-and-never-moves-updated-at.md)).
- **An image row exists only once its file is processed.** No processing or failed state is
  stored. The tile's *Zpracovává se* and its failure live in the open editor only.
- **An upload keeps the browser-made id** of 0022. A new id becomes the gallery's last image. An
  id the article already has gets the new file, and the old version's files go only after the row
  commits, so a failed replacement keeps the old image.
- **An upload under way lands without the hold** on a draft nobody holds that the author may still
  edit: not submitted since, unless the author is the approver (07d). The write accepts this
  tab's hold, or no hold together with those conditions. A submission, a publication or an
  archiving clears the hold too (0021), so "nobody holds it" alone would let the image into a
  submitted or published text. This narrows 0019 and 0021 for an upload only, as 0021 narrowed
  0019's "unexpired". Every other gallery change requires this tab's hold.
- **The whole-form save carries only the alt texts and captions.** It updates them by image id
  and article, so an image still processing changes nothing. It no longer creates or deletes
  images, sets the main image or rewrites the sharing image: the gallery's own saves keep the
  PageSEO image in step with the main image.
- **The order is sent as the list of stored image ids.** An image the list leaves out keeps its
  place after the listed ones.
- `ArticleImage.fileName` (nullable) keeps the picked file's name. Older images have none.

## Consequences

- The issue (26c) and episode (27d) covers reuse `ImageTile` and save the same way, each with its
  own route.
- 0022's rule that a file goes out until a save confirms it no longer applies to articles. The
  article's whole form carries no file, so a leave save always fits in `keepalive`.
- An empty draft whose very first image is still processing is deleted when *Zavřít* releases
  its hold ([0020](0020-a-new-article-is-a-draft-created-on-click.md)). The upload then finds no
  article, drops its files and stores nothing. Revisit this if authors lose images this way.
- A new image that finishes before one picked earlier makes the editor send the order the tiles
  show once the uploads settle, so the web keeps the pick order.
- Alt text typed while its image is still processing goes with the upload as it stood when the
  upload started, and with the next whole-form save once the image is stored. If the editor
  closes before the image lands, later typing is lost; 23h still asks for the alt at submit.
- An upload that got no answer may still have landed: removing its failed tile asks the server
  too, and a removal of an image that does not exist counts as done.
- Progress bars are #227. The current state is described in
  [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Alternatives considered

- **A stored processing or failed status on `ArticleImage`.** About 20 readers would have had to
  leave such images out: the web, sharing previews, the 23h check and the lists. A failure is only
  useful to the person who picked the file, in the editor where they picked it.
- **Keeping files in the whole-form save.** One failed image failed the text with it, and a waiting
  file blocked the `keepalive` leave save.
