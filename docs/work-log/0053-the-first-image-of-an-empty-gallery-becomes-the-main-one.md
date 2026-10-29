# 0053. The first image of an empty gallery becomes the main one

- Date: 2026-10-29

## Context

In the first articles administration (#53), the first image added to an article became its main
image (`handleAddImage` in `add-article/route.tsx`, before 9ad43c78). Then each image started
saving on its own (#673, [0027](0027-each-article-image-saves-on-its-own.md)), and the rule was
dropped by accident; no entry decided it. An upload never set `featuredImageId`. The web showed no
image and no sharing preview until someone picked *Nastavit jako hlavní*. Yet the usual case is
one picture that is meant to be the main one.

Uploads go side by side, each in its own request (24b), so several picked at once can all find
the gallery empty.

## Outcome

- **An upload into an empty gallery becomes the main image.** The gallery counts as empty when no
  image is stored and `featuredImageId` is null. A gallery whose main image was cleared on purpose
  is not empty, and nothing is set; removing the main image makes no other image main
  (in5bl1cq).
- **Of uploads side by side, the first to commit wins.** The claim is a conditional write in the
  upload's own transaction (`featuredImageId` is null and the article's only image is this one),
  so exactly one upload gets it. It is the first stored image, which keeps the main image first
  ([0028](0028-the-main-image-stands-first-in-the-gallery.md)).
- **The sharing preview follows only a claim that took.** It is written after the commit, not in
  it. Publishing writes it again from the main image anyway.
- **The answer says so** (`becameFeatured`). The editor marks the tile *Hlavní* and moves it
  ahead of the tiles still uploading, with no reload.
- **A cancel during the commit** deletes the row, and the relation clears `featuredImageId` with it
  ([0029](0029-an-admin-upload-stays-on-fetch-and-can-be-cancelled-until-it-saves.md)).

## What follows

- `saveArticleImageChange` has an `onSettled` step: it runs on the results of the change's own
  writes once they commit, and adds what only the commit decided to the answer.
- The current state is described in [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Turned down

- **The first-picked file wins.** That would mean holding the other uploads until the first one is
  saved, against 24b's "each by itself". The image that wins still stands first and can be changed
  in the tile's menu.
- **The client sets the main image after the first upload lands.** That is a second request,
  which a closed page or a lost answer leaves unsent, for something one conditional write in the
  upload settles.
